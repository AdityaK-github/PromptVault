use candid::{CandidType, Principal};
use ic_cdk::api::time;
use ic_cdk_macros::*;
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use ic_cdk::query;
use ic_cdk::update;
use std::collections::HashMap;

// Constants
const MAX_TITLE_LENGTH: usize = 100;
const MAX_DESCRIPTION_LENGTH: usize = 500;
const MAX_CONTENT_LENGTH: usize = 10000;
const MAX_TAGS: usize = 10;
const MAX_TAG_LENGTH: usize = 30;

// Types
pub type PromptId = u64;
pub type UserId = Principal;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum PromptCategory {
    Marketing,
    Development,
    Writing,
    Business,
    Education,
    Creative,
    Other,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Prompt {
    pub id: PromptId,
    pub title: String,
    pub description: String,
    pub content: String,
    pub author: UserId,
    pub category: PromptCategory,
    pub tags: Vec<String>,
    pub price: u64, // in e8s (1 ICP = 100_000_000 e8s)
    pub is_premium: bool,
    pub is_public: bool,
    pub created_at: u64,
    pub updated_at: u64,
    pub likes: u64,
    pub purchases: u64,
    pub rating: f64,
    pub total_ratings: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CreatePromptRequest {
    pub title: String,
    pub description: String,
    pub content: String,
    pub category: PromptCategory,
    pub tags: Vec<String>,
    pub price: u64,
    pub is_premium: bool,
    pub is_public: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdatePromptRequest {
    pub id: PromptId,
    pub title: Option<String>,
    pub description: Option<String>,
    pub content: Option<String>,
    pub category: Option<PromptCategory>,
    pub tags: Option<Vec<String>>,
    pub price: Option<u64>,
    pub is_premium: Option<bool>,
    pub is_public: Option<bool>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct RatePromptRequest {
    pub prompt_id: PromptId,
    pub rating: u8, // 1-5 stars
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Purchase {
    pub prompt_id: PromptId,
    pub buyer: UserId,
    pub seller: UserId,
    pub price: u64,
    pub timestamp: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct User {
    pub id: UserId,
    pub username: Option<String>,
    pub email: Option<String>,
    pub joined_at: u64,
    pub total_earnings: u64,
    pub total_spent: u64,
    pub prompts_created: u64,
    pub prompts_purchased: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

// State
thread_local! {
    static PROMPTS: RefCell<HashMap<PromptId, Prompt>> = RefCell::new(HashMap::new());
    static USERS: RefCell<HashMap<UserId, User>> = RefCell::new(HashMap::new());
    static PURCHASES: RefCell<Vec<Purchase>> = RefCell::new(Vec::new());
    static USER_PURCHASES: RefCell<HashMap<UserId, Vec<PromptId>>> = RefCell::new(HashMap::new());
    static USER_LIKES: RefCell<HashMap<UserId, Vec<PromptId>>> = RefCell::new(HashMap::new());
    static USER_RATINGS: RefCell<HashMap<UserId, HashMap<PromptId, u8>>> = RefCell::new(HashMap::new());
    static NEXT_PROMPT_ID: RefCell<PromptId> = RefCell::new(1);
}

// Helper functions
fn get_caller() -> UserId {
    ic_cdk::caller()
}

fn get_time() -> u64 {
    time()
}

fn is_authorized(prompt_id: PromptId, caller: UserId) -> bool {
    PROMPTS.with(|p| {
        let prompts = p.borrow();
        match prompts.get(&prompt_id) {
            Some(prompt) => prompt.author == caller,
            None => false,
        }
    })
}

fn has_purchased(user_id: UserId, prompt_id: PromptId) -> bool {
    USER_PURCHASES.with(|up| {
        let user_purchases = up.borrow();
        match user_purchases.get(&user_id) {
            Some(purchases) => purchases.contains(&prompt_id),
            None => false,
        }
    })
}

fn validate_prompt_input(request: &CreatePromptRequest) -> Result<(), String> {
    if request.title.trim().is_empty() {
        return Err("Title cannot be empty".to_string());
    }
    if request.title.len() > MAX_TITLE_LENGTH {
        return Err(format!("Title cannot exceed {} characters", MAX_TITLE_LENGTH));
    }
    if request.description.len() > MAX_DESCRIPTION_LENGTH {
        return Err(format!("Description cannot exceed {} characters", MAX_DESCRIPTION_LENGTH));
    }
    if request.content.trim().is_empty() {
        return Err("Content cannot be empty".to_string());
    }
    if request.content.len() > MAX_CONTENT_LENGTH {
        return Err(format!("Content cannot exceed {} characters", MAX_CONTENT_LENGTH));
    }
    if request.tags.len() > MAX_TAGS {
        return Err(format!("Cannot have more than {} tags", MAX_TAGS));
    }
    for tag in &request.tags {
        if tag.len() > MAX_TAG_LENGTH {
            return Err(format!("Tag cannot exceed {} characters", MAX_TAG_LENGTH));
        }
    }
    Ok(())
}

fn validate_rating(rating: u8) -> Result<(), String> {
    if rating < 1 || rating > 5 {
        return Err("Rating must be between 1 and 5".to_string());
    }
    Ok(())
}

fn safe_f64_average(total: f64, count: u64) -> f64 {
    if count == 0 {
        0.0
    } else {
        let avg = total / count as f64;
        if avg.is_finite() {
            avg
        } else {
            0.0
        }
    }
}

// Public functions
#[init]
fn init() {
    ic_cdk::println!("Prompt Vault initialized");
}

#[update]
fn create_user(username: Option<String>, email: Option<String>) -> ApiResponse<User> {
    let caller = get_caller();
    
    // Check if user already exists
    let user_exists = USERS.with(|u| {
        let users = u.borrow();
        users.contains_key(&caller)
    });
    
    if user_exists {
        return ApiResponse {
            success: false,
            data: None,
            error: Some("User already exists".to_string()),
        };
    }
    
    // Validate username if provided
    if let Some(ref name) = username {
        if name.trim().is_empty() || name.len() > 50 {
            return ApiResponse {
                success: false,
                data: None,
                error: Some("Username must be between 1 and 50 characters".to_string()),
            };
        }
    }
    
    let user = User {
        id: caller,
        username,
        email,
        joined_at: get_time(),
        total_earnings: 0,
        total_spent: 0,
        prompts_created: 0,
        prompts_purchased: 0,
    };
    
    USERS.with(|u| {
        let mut users = u.borrow_mut();
        users.insert(caller, user.clone());
    });
    
    ApiResponse {
        success: true,
        data: Some(user),
        error: None,
    }
}

#[ic_cdk::query]
fn get_user(user_id: Principal) -> ApiResponse<User> {
    USERS.with(|u| {
        let users = u.borrow();
        match users.get(&user_id) {
            Some(user) => ApiResponse {
                success: true,
                data: Some(user.clone()),
                error: None,
            },
            None => ApiResponse {
                success: false,
                data: None,
                error: Some("User not found".to_string()),
            },
        }
    })
}


#[ic_cdk::update]
fn create_prompt(request: CreatePromptRequest) -> ApiResponse<Prompt> {
    let caller = get_caller();
    
    // Validate input
    if let Err(error) = validate_prompt_input(&request) {
        return ApiResponse {
            success: false,
            data: None,
            error: Some(error),
        };
    }
    
    // Ensure user exists
    let user_exists = USERS.with(|u| {
        let users = u.borrow();
        users.contains_key(&caller)
    });
    
    if !user_exists {
        return ApiResponse {
            success: false,
            data: None,
            error: Some("User not found. Please create a user first.".to_string()),
        };
    }
    
    let prompt_id = NEXT_PROMPT_ID.with(|id| {
        let mut next_id = id.borrow_mut();
        let current_id = *next_id;
        *next_id += 1;
        current_id
    });
    
    let now = get_time();
    let prompt = Prompt {
        id: prompt_id,
        title: request.title.trim().to_string(),
        description: request.description,
        content: request.content,
        author: caller,
        category: request.category,
        tags: request.tags,
        price: request.price,
        is_premium: request.is_premium,
        is_public: request.is_public,
        created_at: now,
        updated_at: now,
        likes: 0,
        purchases: 0,
        rating: 0.0,
        total_ratings: 0,
    };
    
    PROMPTS.with(|p| {
        let mut prompts = p.borrow_mut();
        prompts.insert(prompt_id, prompt.clone());
    });
    
    // Update user stats
    USERS.with(|u| {
        let mut users = u.borrow_mut();
        if let Some(user) = users.get_mut(&caller) {
            user.prompts_created += 1;
        }
    });
    
    ApiResponse {
        success: true,
        data: Some(prompt),
        error: None,
    }
}

#[ic_cdk::query]
fn get_prompt(prompt_id: PromptId) -> ApiResponse<Prompt> {
    PROMPTS.with(|p| {
        let prompts = p.borrow();
        match prompts.get(&prompt_id) {
            Some(prompt) => ApiResponse {
                success: true,
                data: Some(prompt.clone()),
                error: None,
            },
            None => ApiResponse {
                success: false,
                data: None,
                error: Some("Prompt not found".to_string()),
            },
        }
    })
}

#[ic_cdk::query]
fn get_public_prompts() -> ApiResponse<Vec<Prompt>> {
    PROMPTS.with(|p| {
        let prompts = p.borrow();
        let public_prompts: Vec<Prompt> = prompts
            .values()
            .filter(|prompt| prompt.is_public)
            .cloned()
            .collect();
        
        ApiResponse {
            success: true,
            data: Some(public_prompts),
            error: None,
        }
    })
}

#[ic_cdk::query]
fn get_user_prompts(user_id: UserId) -> ApiResponse<Vec<Prompt>> {
    PROMPTS.with(|p| {
        let prompts = p.borrow();
        let user_prompts: Vec<Prompt> = prompts
            .values()
            .filter(|prompt| prompt.author == user_id)
            .cloned()
            .collect();
        
        ApiResponse {
            success: true,
            data: Some(user_prompts),
            error: None,
        }
    })
}

#[ic_cdk::update]
fn update_prompt(request: UpdatePromptRequest) -> ApiResponse<Prompt> {
    let caller = get_caller();
    
    if !is_authorized(request.id, caller) {
        return ApiResponse {
            success: false,
            data: None,
            error: Some("Unauthorized".to_string()),
        };
    }
    
    PROMPTS.with(|p| {
        let mut prompts = p.borrow_mut();
        match prompts.get_mut(&request.id) {
            Some(prompt) => {
                if let Some(title) = request.title {
                    if title.trim().is_empty() || title.len() > MAX_TITLE_LENGTH {
                        return ApiResponse {
                            success: false,
                            data: None,
                            error: Some("Invalid title".to_string()),
                        };
                    }
                    prompt.title = title.trim().to_string();
                }
                if let Some(description) = request.description {
                    if description.len() > MAX_DESCRIPTION_LENGTH {
                        return ApiResponse {
                            success: false,
                            data: None,
                            error: Some("Description too long".to_string()),
                        };
                    }
                    prompt.description = description;
                }
                if let Some(content) = request.content {
                    if content.trim().is_empty() || content.len() > MAX_CONTENT_LENGTH {
                        return ApiResponse {
                            success: false,
                            data: None,
                            error: Some("Invalid content".to_string()),
                        };
                    }
                    prompt.content = content;
                }
                if let Some(category) = request.category {
                    prompt.category = category;
                }
                if let Some(tags) = request.tags {
                    if tags.len() > MAX_TAGS {
                        return ApiResponse {
                            success: false,
                            data: None,
                            error: Some("Too many tags".to_string()),
                        };
                    }
                    prompt.tags = tags;
                }
                if let Some(price) = request.price {
                    prompt.price = price;
                }
                if let Some(is_premium) = request.is_premium {
                    prompt.is_premium = is_premium;
                }
                if let Some(is_public) = request.is_public {
                    prompt.is_public = is_public;
                }
                prompt.updated_at = get_time();
                
                ApiResponse {
                    success: true,
                    data: Some(prompt.clone()),
                    error: None,
                }
            }
            None => ApiResponse {
                success: false,
                data: None,
                error: Some("Prompt not found".to_string()),
            },
        }
    })
}

#[ic_cdk::update]
fn delete_prompt(prompt_id: PromptId) -> ApiResponse<String> {
    let caller = get_caller();
    
    if !is_authorized(prompt_id, caller) {
        return ApiResponse {
            success: false,
            data: None,
            error: Some("Unauthorized".to_string()),
        };
    }
    
    let removed = PROMPTS.with(|p| {
        let mut prompts = p.borrow_mut();
        prompts.remove(&prompt_id).is_some()
    });
    
    if removed {
        // Update user stats
        USERS.with(|u| {
            let mut users = u.borrow_mut();
            if let Some(user) = users.get_mut(&caller) {
                if user.prompts_created > 0 {
                    user.prompts_created -= 1;
                }
            }
        });
        
        ApiResponse {
            success: true,
            data: Some("Prompt deleted successfully".to_string()),
            error: None,
        }
    } else {
        ApiResponse {
            success: false,
            data: None,
            error: Some("Prompt not found".to_string()),
        }
    }
}

#[ic_cdk::update]
fn purchase_prompt(prompt_id: PromptId) -> ApiResponse<String> {
    let caller = get_caller();
    
    // Check if prompt exists
    let prompt_info = PROMPTS.with(|p| {
        let prompts = p.borrow();
        prompts.get(&prompt_id).cloned()
    });
    
    let prompt = match prompt_info {
        Some(p) => p,
        None => return ApiResponse {
            success: false,
            data: None,
            error: Some("Prompt not found".to_string()),
        },
    };
    
    // Check if user is trying to buy their own prompt
    if prompt.author == caller {
        return ApiResponse {
            success: false,
            data: None,
            error: Some("Cannot purchase your own prompt".to_string()),
        };
    }
    
    // Check if already purchased
    if has_purchased(caller, prompt_id) {
        return ApiResponse {
            success: false,
            data: None,
            error: Some("Prompt already purchased".to_string()),
        };
    }
    
    // For now, we'll simulate the payment process
    // In a real implementation, you'd integrate with ICP ledger
    
    let purchase = Purchase {
        prompt_id,
        buyer: caller,
        seller: prompt.author,
        price: prompt.price,
        timestamp: get_time(),
    };
    
    // Record purchase
    PURCHASES.with(|p| {
        let mut purchases = p.borrow_mut();
        purchases.push(purchase);
    });
    
    // Update user purchases
    USER_PURCHASES.with(|up| {
        let mut user_purchases = up.borrow_mut();
        user_purchases.entry(caller).or_insert_with(Vec::new).push(prompt_id);
    });
    
    // Update prompt stats
    PROMPTS.with(|p| {
        let mut prompts = p.borrow_mut();
        if let Some(prompt) = prompts.get_mut(&prompt_id) {
            prompt.purchases += 1;
        }
    });
    
    // Update user stats
    USERS.with(|u| {
        let mut users = u.borrow_mut();
        if let Some(buyer) = users.get_mut(&caller) {
            buyer.prompts_purchased += 1;
            buyer.total_spent += prompt.price;
        }
        if let Some(seller) = users.get_mut(&prompt.author) {
            seller.total_earnings += prompt.price;
        }
    });
    
    ApiResponse {
        success: true,
        data: Some("Purchase successful".to_string()),
        error: None,
    }
}

#[ic_cdk::query]
fn get_prompt_content(prompt_id: PromptId) -> ApiResponse<String> {
    let caller = get_caller();
    
    let prompt = PROMPTS.with(|p| {
        let prompts = p.borrow();
        prompts.get(&prompt_id).cloned()
    });
    
    match prompt {
        Some(p) => {
            // Allow access if: prompt is public, user is author, or user has purchased
            if p.is_public || p.author == caller || has_purchased(caller, prompt_id) {
                ApiResponse {
                    success: true,
                    data: Some(p.content),
                    error: None,
                }
            } else {
                ApiResponse {
                    success: false,
                    data: None,
                    error: Some("Access denied. Purchase required.".to_string()),
                }
            }
        }
        None => ApiResponse {
            success: false,
            data: None,
            error: Some("Prompt not found".to_string()),
        },
    }
}

#[ic_cdk::update]
fn like_prompt(prompt_id: PromptId) -> ApiResponse<String> {
    let caller = get_caller();
    
    // Check if prompt exists
    let prompt_exists = PROMPTS.with(|p| {
        let prompts = p.borrow();
        prompts.contains_key(&prompt_id)
    });
    
    if !prompt_exists {
        return ApiResponse {
            success: false,
            data: None,
            error: Some("Prompt not found".to_string()),
        };
    }
    
    // Check if already liked
    let already_liked = USER_LIKES.with(|ul| {
        let user_likes = ul.borrow();
        match user_likes.get(&caller) {
            Some(likes) => likes.contains(&prompt_id),
            None => false,
        }
    });
    
    if already_liked {
        return ApiResponse {
            success: false,
            data: None,
            error: Some("Prompt already liked".to_string()),
        };
    }
    
    // Add like
    USER_LIKES.with(|ul| {
        let mut user_likes = ul.borrow_mut();
        user_likes.entry(caller).or_insert_with(Vec::new).push(prompt_id);
    });
    
    // Update prompt likes count
    PROMPTS.with(|p| {
        let mut prompts = p.borrow_mut();
        if let Some(prompt) = prompts.get_mut(&prompt_id) {
            prompt.likes += 1;
        }
    });
    
    ApiResponse {
        success: true,
        data: Some("Prompt liked successfully".to_string()),
        error: None,
    }
}

#[ic_cdk::update]
fn unlike_prompt(prompt_id: PromptId) -> ApiResponse<String> {
    let caller = get_caller();
    
    // Check if prompt exists
    let prompt_exists = PROMPTS.with(|p| {
        let prompts = p.borrow();
        prompts.contains_key(&prompt_id)
    });
    
    if !prompt_exists {
        return ApiResponse {
            success: false,
            data: None,
            error: Some("Prompt not found".to_string()),
        };
    }
    
    // Check if actually liked
    let was_liked = USER_LIKES.with(|ul| {
        let mut user_likes = ul.borrow_mut();
        match user_likes.get_mut(&caller) {
            Some(likes) => {
                if let Some(pos) = likes.iter().position(|&x| x == prompt_id) {
                    likes.remove(pos);
                    true
                } else {
                    false
                }
            }
            None => false,
        }
    });
    
    if !was_liked {
        return ApiResponse {
            success: false,
            data: None,
            error: Some("Prompt was not liked".to_string()),
        };
    }
    
    // Update prompt likes count
    PROMPTS.with(|p| {
        let mut prompts = p.borrow_mut();
        if let Some(prompt) = prompts.get_mut(&prompt_id) {
            if prompt.likes > 0 {
                prompt.likes -= 1;
            }
        }
    });
    
    ApiResponse {
        success: true,
        data: Some("Prompt unliked successfully".to_string()),
        error: None,
    }
}

#[ic_cdk::update]
fn rate_prompt(request: RatePromptRequest) -> ApiResponse<String> {
    let caller = get_caller();
    
    // Validate rating
    if let Err(error) = validate_rating(request.rating) {
        return ApiResponse {
            success: false,
            data: None,
            error: Some(error),
        };
    }
    
    // Check if prompt exists
    let prompt_exists = PROMPTS.with(|p| {
        let prompts = p.borrow();
        prompts.contains_key(&request.prompt_id)
    });
    
    if !prompt_exists {
        return ApiResponse {
            success: false,
            data: None,
            error: Some("Prompt not found".to_string()),
        };
    }
    
    // Check if user owns the prompt
    if is_authorized(request.prompt_id, caller) {
        return ApiResponse {
            success: false,
            data: None,
            error: Some("Cannot rate your own prompt".to_string()),
        };
    }
    
    // Check if user has purchased the prompt or it's public
    let can_rate = PROMPTS.with(|p| {
        let prompts = p.borrow();
        if let Some(prompt) = prompts.get(&request.prompt_id) {
            prompt.is_public || has_purchased(caller, request.prompt_id)
        } else {
            false
        }
    });
    
    if !can_rate {
        return ApiResponse {
            success: false,
            data: None,
            error: Some("Must purchase prompt to rate it".to_string()),
        };
    }
    
    // Record or update the rating
    let previous_rating = USER_RATINGS.with(|ur| {
        let mut user_ratings = ur.borrow_mut();
        user_ratings
            .entry(caller)
            .or_insert_with(HashMap::new)
            .insert(request.prompt_id, request.rating)
    });
    
    // Update prompt rating
    PROMPTS.with(|p| {
        let mut prompts = p.borrow_mut();
        if let Some(prompt) = prompts.get_mut(&request.prompt_id) {
            if previous_rating.is_none() {
                // New rating
                prompt.total_ratings += 1;
                let total_score = prompt.rating * (prompt.total_ratings - 1) as f64 + request.rating as f64;
                prompt.rating = safe_f64_average(total_score, prompt.total_ratings);
            } else {
                // Update existing rating
                let old_rating = previous_rating.unwrap() as f64;
                let total_score = prompt.rating * prompt.total_ratings as f64 - old_rating + request.rating as f64;
                prompt.rating = safe_f64_average(total_score, prompt.total_ratings);
            }
        }
    });
    
    ApiResponse {
        success: true,
        data: Some("Prompt rated successfully".to_string()),
        error: None,
    }
}

#[ic_cdk::query]
fn get_user_purchases(user_id: UserId) -> ApiResponse<Vec<PromptId>> {
    USER_PURCHASES.with(|up| {
        let user_purchases = up.borrow();
        match user_purchases.get(&user_id) {
            Some(purchases) => ApiResponse {
                success: true,
                data: Some(purchases.clone()),
                error: None,
            },
            None => ApiResponse {
                success: true,
                data: Some(Vec::new()),
                error: None,
            },
        }
    })
}

#[query]
fn search_prompts(query: String, category: Option<PromptCategory>) -> ApiResponse<Vec<Prompt>> {
    PROMPTS.with(|p| {
        let prompts = p.borrow();
        let mut results: Vec<Prompt> = prompts
            .values()
            .filter(|prompt| {
                // Only search public prompts
                if !prompt.is_public {
                    return false;
                }
                
                // Category filter
                if let Some(ref cat) = category {
                    if prompt.category != *cat {
                        return false;
                    }
                }
                
                // Text search in title, description, and tags
                let query_lower = query.to_lowercase();
                prompt.title.to_lowercase().contains(&query_lower) ||
                prompt.description.to_lowercase().contains(&query_lower) ||
                prompt.tags.iter().any(|tag| tag.to_lowercase().contains(&query_lower))
            })
            .cloned()
            .collect();
        
        // Sort by relevance (likes + purchases + rating)
        results.sort_by(|a, b| {
            let score_a = a.likes + a.purchases + (a.rating * 10.0) as u64;
            let score_b = b.likes + b.purchases + (b.rating * 10.0) as u64;
            score_b.cmp(&score_a)
        });
        
        ApiResponse {
            success: true,
            data: Some(results),
            error: None,
        }
    })
}