import React, { useState, useEffect } from 'react';
import { Search, Plus, Heart, ShoppingCart, User, Star, Filter, Tag, LogIn, LogOut } from 'lucide-react';
import icpAgent from './agent';

// PromptCategory enum matching your Rust contract
const PromptCategory = {
  Marketing: 'Marketing',
  Development: 'Development', 
  Writing: 'Writing',
  Business: 'Business',
  Education: 'Education',
  Creative: 'Creative',
  Other: 'Other'
};

// Components
const PromptCard = ({ prompt, onPurchase, onLike, isPurchased = false, isOwned = false }) => {
  const priceInICP = Number(prompt.price) / 100000000; // Convert e8s to ICP
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          prompt.category === 'Marketing' ? 'bg-blue-100 text-blue-800' :
          prompt.category === 'Development' ? 'bg-green-100 text-green-800' :
          prompt.category === 'Creative' ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {prompt.category}
        </span>
        <div className="flex gap-2">
          {prompt.is_premium && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Premium</span>
          )}
          {isOwned && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Owned</span>
          )}
        </div>
      </div>
      
      <h3 className="font-semibold text-lg mb-2">{prompt.title}</h3>
      <p className="text-gray-600 text-sm mb-3">{prompt.description}</p>
      
      <div className="flex flex-wrap gap-1 mb-3">
        {prompt.tags.map(tag => (
          <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
            #{tag}
          </span>
        ))}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Heart size={14} />
            {Number(prompt.likes)}
          </span>
          <span className="flex items-center gap-1">
            <ShoppingCart size={14} />
            {Number(prompt.purchases)}
          </span>
          <span className="flex items-center gap-1">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            {prompt.rating.toFixed(1)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-semibold">{priceInICP.toFixed(2)} ICP</span>
          {!isPurchased && !isOwned && (
            <button 
              onClick={() => onPurchase(prompt.id)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              Buy
            </button>
          )}
          <button 
            onClick={() => onLike(prompt.id)}
            className="p-2 text-gray-500 hover:text-red-500 transition-colors"
          >
            <Heart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const CreatePromptModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: 'Marketing',
    tags: '',
    price: '',
    is_premium: false,
    is_public: true
  });

  const handleSubmit = () => {
    const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    const priceInE8s = Math.floor(parseFloat(formData.price || '0') * 100000000);
    
    onSubmit({
      ...formData,
      tags: tagsArray,
      price: priceInE8s
    });
    onClose();
    setFormData({
      title: '',
      description: '',
      content: '',
      category: 'Marketing',
      tags: '',
      price: '',
      is_premium: false,
      is_public: true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Create New Prompt</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea
                required
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter your prompt content here..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  {Object.values(PromptCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Price (ICP)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="ai, writing, marketing"
              />
            </div>
            
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_premium}
                  onChange={(e) => setFormData({...formData, is_premium: e.target.checked})}
                  className="mr-2"
                />
                Premium Prompt
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                  className="mr-2"
                />
                Public
              </label>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Prompt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [currentPage, setCurrentPage] = useState('marketplace');
  const [prompts, setPrompts] = useState([]);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPurchases, setUserPurchases] = useState([]);
  const [userPrompts, setUserPrompts] = useState([]);
  const [error, setError] = useState('');

  // Initialize ICP Agent
  useEffect(() => {
    const initAgent = async () => {
      try {
        setLoading(true);
        const success = await icpAgent.init();
        if (success) {
          setIsAuthenticated(icpAgent.isAuthenticated);
          await loadInitialData();
        } else {
          setError('Failed to initialize ICP connection');
        }
      } catch (error) {
        console.error('Failed to initialize ICP agent:', error);
        setError('Failed to connect to ICP network');
      } finally {
        setLoading(false);
      }
    };

    initAgent();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load public prompts
      const promptsResponse = await icpAgent.getPublicPrompts();
      if (promptsResponse.success && promptsResponse.data) {
        setPrompts(promptsResponse.data);
      }

      // Load user data if authenticated
      if (icpAgent.isAuthenticated) {
        const userResponse = await icpAgent.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data);
        }

        // Load user purchases
        const purchasesResponse = await icpAgent.getUserPurchases();
        if (purchasesResponse.success && purchasesResponse.data) {
          setUserPurchases(purchasesResponse.data);
        }

        // Load user's created prompts
        const userPromptsResponse = await icpAgent.getUserPrompts();
        if (userPromptsResponse.success && userPromptsResponse.data) {
          setUserPrompts(userPromptsResponse.data);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load data from ICP network');
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      await icpAgent.login();
      setIsAuthenticated(true);
      
      // Try to get existing user or create new one
      const userResponse = await icpAgent.getCurrentUser();
      if (!userResponse.success) {
        // Create new user
        const createResponse = await icpAgent.createUser(null, null);
        if (createResponse.success && createResponse.data) {
          setUser(createResponse.data);
        }
      } else {
        setUser(userResponse.data);
      }
      
      await loadInitialData();
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await icpAgent.logout();
      setIsAuthenticated(false);
      setUser(null);
      setUserPurchases([]);
      setUserPrompts([]);
      await loadInitialData(); // Reload public data
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await icpAgent.searchPrompts(searchQuery, selectedCategory || null);
      if (response.success && response.data) {
        setPrompts(response.data);
      } else {
        setError(response.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (promptId) => {
    if (!isAuthenticated) {
      setError('Please login to purchase prompts');
      return;
    }

    try {
      const response = await icpAgent.purchasePrompt(promptId);
      if (response.success) {
        alert('Purchase successful!');
        // Refresh data
        await loadInitialData();
      } else {
        alert('Purchase failed: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase error: ' + error.message);
    }
  };

  const handleLike = async (promptId) => {
    if (!isAuthenticated) {
      setError('Please login to like prompts');
      return;
    }

    try {
      const response = await icpAgent.likePrompt(promptId);
      if (response.success) {
        // Refresh prompts to show updated like count
        const promptsResponse = await icpAgent.getPublicPrompts();
        if (promptsResponse.success && promptsResponse.data) {
          setPrompts(promptsResponse.data);
        }
      } else {
        setError(response.error || 'Failed to like prompt');
      }
    } catch (error) {
      console.error('Like error:', error);
      setError('Failed to like prompt');
    }
  };

  const handleCreatePrompt = async (promptData) => {
    if (!isAuthenticated) {
      setError('Please login to create prompts');
      return;
    }

    try {
      const response = await icpAgent.createPrompt(promptData);
      if (response.success) {
        alert('Prompt created successfully!');
        // Refresh data
        await loadInitialData();
      } else {
        alert('Failed to create prompt: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Create prompt error:', error);
      alert('Error creating prompt: ' + error.message);
    }
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = !searchQuery || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || prompt.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const isPromptPurchased = (promptId) => {
    return userPurchases.some(id => Number(id) === Number(promptId));
  };

  const isPromptOwned = (prompt) => {
    return isAuthenticated && icpAgent.getPrincipal() === prompt.author.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading Prompt Vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">Prompt Vault</h1>
              
              <nav className="flex space-x-6">
                <button
                  onClick={() => setCurrentPage('marketplace')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === 'marketplace' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Marketplace
                </button>
                {isAuthenticated && (
                  <button
                    onClick={() => setCurrentPage('my-prompts')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentPage === 'my-prompts' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    My Prompts
                  </button>
                )}
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Create
                  </button>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <User size={18} className="text-gray-500" />
                    <span className="font-medium">
                      {user?.username || icpAgent.getPrincipal()?.slice(0, 8) + '...'}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <LogIn size={18} />
                  Login with Internet Identity
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
            <button
              onClick={() => setError('')}
              className="float-right font-bold text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'marketplace' && (
          <>
            {/* Search and Filters */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search prompts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {Object.values(PromptCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Prompts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrompts.map(prompt => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onPurchase={handlePurchase}
                  onLike={handleLike}
                  isPurchased={isPromptPurchased(prompt.id)}
                  isOwned={isPromptOwned(prompt)}
                />
              ))}
            </div>

            {filteredPrompts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No prompts found. Try adjusting your search criteria.</p>
              </div>
            )}
          </>
        )}

        {currentPage === 'my-prompts' && isAuthenticated && user && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">My Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{Number(user.prompts_created)}</div>
                  <div className="text-sm text-gray-600">Prompts Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{(Number(user.total_earnings) / 100000000).toFixed(2)}</div>
                  <div className="text-sm text-gray-600">ICP Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{Number(user.prompts_purchased)}</div>
                  <div className="text-sm text-gray-600">Prompts Bought</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{(Number(user.total_spent) / 100000000).toFixed(2)}</div>
                  <div className="text-sm text-gray-600">ICP Spent</div>
                </div>
              </div>
            </div>
            
            {/* Created Prompts */}
            {userPrompts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">My Created Prompts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userPrompts.map(prompt => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      onPurchase={() => {}}
                      onLike={handleLike}
                      isOwned={true}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {userPrompts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">You haven't created any prompts yet. Click "Create" to get started!</p>
              </div>
            )}
          </div>
        )}

        {currentPage === 'my-prompts' && !isAuthenticated && (
          <div className="text-center py-12">
            <p className="text-gray-500">Please login to view your prompts.</p>
          </div>
        )}
      </main>

      {/* Create Prompt Modal */}
      <CreatePromptModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePrompt}
      />
    </div>
  );
};

export default App;