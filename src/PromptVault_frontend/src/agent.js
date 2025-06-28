// agent.js - ICP Agent setup and canister interface
import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';

// Canister ID for local replica (replace with your actual canister ID)
const CANISTER_ID = process.env.REACT_APP_CANISTER_ID;

// Local replica configuration
const LOCAL_REPLICA_URL = 'http://127.0.0.1:4943';

// IDL (Interface Description Language) for your canister
const idlFactory = ({ IDL }) => {
  const PromptCategory = IDL.Variant({
    'Marketing': IDL.Null,
    'Development': IDL.Null,
    'Writing': IDL.Null,
    'Business': IDL.Null,
    'Education': IDL.Null,
    'Creative': IDL.Null,
    'Other': IDL.Null,
  });

  const CreatePromptRequest = IDL.Record({
    'title': IDL.Text,
    'description': IDL.Text,
    'content': IDL.Text,
    'category': PromptCategory,
    'tags': IDL.Vec(IDL.Text),
    'price': IDL.Nat64,
    'is_premium': IDL.Bool,
    'is_public': IDL.Bool,
  });

  const Prompt = IDL.Record({
    'id': IDL.Nat64,
    'title': IDL.Text,
    'description': IDL.Text,
    'content': IDL.Text,
    'author': IDL.Principal,
    'category': PromptCategory,
    'tags': IDL.Vec(IDL.Text),
    'price': IDL.Nat64,
    'is_premium': IDL.Bool,
    'is_public': IDL.Bool,
    'created_at': IDL.Nat64,
    'updated_at': IDL.Nat64,
    'likes': IDL.Nat64,
    'purchases': IDL.Nat64,
    'rating': IDL.Float64,
    'total_ratings': IDL.Nat64,
  });

  const User = IDL.Record({
    'id': IDL.Principal,
    'username': IDL.Opt(IDL.Text),
    'email': IDL.Opt(IDL.Text),
    'joined_at': IDL.Nat64,
    'total_earnings': IDL.Nat64,
    'total_spent': IDL.Nat64,
    'prompts_created': IDL.Nat64,
    'prompts_purchased': IDL.Nat64,
  });

  const ApiResponse = (T) => IDL.Record({
    'success': IDL.Bool,
    'data': IDL.Opt(T),
    'error': IDL.Opt(IDL.Text),
  });

  return IDL.Service({
    'create_user': IDL.Func([IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)], [ApiResponse(User)], []),
    'get_user': IDL.Func([IDL.Principal], [ApiResponse(User)], ['query']),
    'create_prompt': IDL.Func([CreatePromptRequest], [ApiResponse(Prompt)], []),
    'get_prompt': IDL.Func([IDL.Nat64], [ApiResponse(Prompt)], ['query']),
    'get_public_prompts': IDL.Func([], [ApiResponse(IDL.Vec(Prompt))], ['query']),
    'get_user_prompts': IDL.Func([IDL.Principal], [ApiResponse(IDL.Vec(Prompt))], ['query']),
    'purchase_prompt': IDL.Func([IDL.Nat64], [ApiResponse(IDL.Text)], []),
    'get_prompt_content': IDL.Func([IDL.Nat64], [ApiResponse(IDL.Text)], ['query']),
    'like_prompt': IDL.Func([IDL.Nat64], [ApiResponse(IDL.Text)], []),
    'get_user_purchases': IDL.Func([IDL.Principal], [ApiResponse(IDL.Vec(IDL.Nat64))], ['query']),
    'search_prompts': IDL.Func([IDL.Text, IDL.Opt(PromptCategory)], [ApiResponse(IDL.Vec(Prompt))], ['query']),
  });
};

class ICPAgent {
  constructor() {
    this.agent = null;
    this.actor = null;
    this.authClient = null;
    this.isAuthenticated = false;
    this.identity = null;
  }

  async init() {
    try {
      // Initialize auth client
      this.authClient = await AuthClient.create();
      this.isAuthenticated = await this.authClient.isAuthenticated();

      // Create agent
      this.agent = new HttpAgent({ 
        host: LOCAL_REPLICA_URL,
        identity: this.isAuthenticated ? this.authClient.getIdentity() : undefined
      });

      // Fetch root key for local replica (NEVER do this in production)
      if (process.env.NODE_ENV !== 'production') {
        await this.agent.fetchRootKey();
      }

      // Create actor
      this.actor = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: CANISTER_ID,
      });

      console.log('ICP Agent initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize ICP Agent:', error);
      return false;
    }
  }

  async login() {
    try {
      await this.authClient.login({
        identityProvider: process.env.NODE_ENV === 'production' 
          ? '"https://icp0.io"' 
          : `http://127.0.0.1:4943/?canisterId=${process.env.REACT_APP_INTERNET_IDENTITY_CANISTER_ID}`,
        onSuccess: async () => {
          this.isAuthenticated = true;
          this.identity = this.authClient.getIdentity();
          
          // Reinitialize agent with new identity
          this.agent = new HttpAgent({ 
            host: LOCAL_REPLICA_URL,
            identity: this.identity
          });
          
          if (process.env.NODE_ENV !== 'production') {
            await this.agent.fetchRootKey();
          }

          this.actor = Actor.createActor(idlFactory, {
            agent: this.agent,
            canisterId: CANISTER_ID,
          });

          console.log('Logged in successfully');
        },
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logout() {
    await this.authClient.logout();
    this.isAuthenticated = false;
    this.identity = null;
    await this.init(); // Reinitialize with anonymous identity
  }

  getPrincipal() {
    return this.identity?.getPrincipal()?.toString() || null;
  }

  // API methods matching your Rust canister
  async createUser(username, email) {
    if (!this.isAuthenticated) throw new Error('Authentication required');
    return await this.actor.create_user(username ? [username] : [], email ? [email] : []);
  }

  async getUser(userId) {
    const principal = typeof userId === 'string' ? { _arr: [], _isPrincipal: true } : userId;
    return await this.actor.get_user(principal);
  }

  async getCurrentUser() {
    if (!this.isAuthenticated) return { success: false, error: 'Not authenticated' };
    return await this.actor.get_user(this.identity.getPrincipal());
  }

  async createPrompt(promptData) {
    if (!this.isAuthenticated) throw new Error('Authentication required');
    
    const request = {
      title: promptData.title,
      description: promptData.description,
      content: promptData.content,
      category: { [promptData.category]: null },
      tags: promptData.tags,
      price: BigInt(promptData.price),
      is_premium: promptData.is_premium,
      is_public: promptData.is_public,
    };
    
    return await this.actor.create_prompt(request);
  }

  async getPublicPrompts() {
    return await this.actor.get_public_prompts();
  }

  async searchPrompts(query, category) {
    const categoryVariant = category ? { [category]: null } : [];
    return await this.actor.search_prompts(query, categoryVariant);
  }

  async purchasePrompt(promptId) {
    if (!this.isAuthenticated) throw new Error('Authentication required');
    return await this.actor.purchase_prompt(BigInt(promptId));
  }

  async likePrompt(promptId) {
    if (!this.isAuthenticated) throw new Error('Authentication required');
    return await this.actor.like_prompt(BigInt(promptId));
  }

  async getUserPurchases(userId) {
    const principal = userId || this.identity.getPrincipal();
    return await this.actor.get_user_purchases(principal);
  }

  async getUserPrompts(userId) {
    const principal = userId || this.identity.getPrincipal();
    return await this.actor.get_user_prompts(principal);
  }

  async getPromptContent(promptId) {
    return await this.actor.get_prompt_content(BigInt(promptId));
  }
}

// Create singleton instance
const icpAgent = new ICPAgent();

export default icpAgent;