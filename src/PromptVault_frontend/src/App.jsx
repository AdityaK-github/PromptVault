import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Heart,
  ShoppingCart,
  User,
  Star,
  Filter,
  Tag,
  LogIn,
  LogOut,
} from "lucide-react";
import icpAgent from "./agent";
import PromptDetail from "./PromptDetail";
import UserBalance from "./UserBalance";
import Header from "./components/Header";
import SearchFilters from "./components/SearchFilters";
import Marketplace from "./components/Marketplace";
import MyPrompts from "./components/MyPrompts";
import CreatePromptModal from "./components/CreatePromptModal";

// PromptCategory enum matching your Rust contract
const PromptCategory = {
  Marketing: "Marketing",
  Development: "Development",
  Writing: "Writing",
  Business: "Business",
  Education: "Education",
  Creative: "Creative",
  Other: "Other",
};

// Helper to safely convert Principal or string to string
const getPrincipalString = (principal) => {
  if (!principal) return "";
  if (typeof principal === "string") return principal;
  if (typeof principal.toString === "function") return principal.toString();
  return "";
};

function App() {
  const [currentPage, setCurrentPage] = useState("marketplace");
  const [prompts, setPrompts] = useState([]);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPurchases, setUserPurchases] = useState([]);
  const [userPrompts, setUserPrompts] = useState([]);
  const [error, setError] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState(null);

  // Initialize ICP Agent
  useEffect(() => {
    const initAgent = async () => {
      try {
        setLoading(true);
        setError("");

        // Check if icpAgent exists and has init method
        if (!icpAgent || typeof icpAgent.init !== "function") {
          throw new Error("ICP Agent not properly initialized");
        }

        const success = await icpAgent.init();
        if (success) {
          setIsAuthenticated(icpAgent.isAuthenticated || false);
          await loadInitialData();
        } else {
          setError("Failed to initialize ICP connection");
        }
      } catch (error) {
        console.error("Failed to initialize ICP agent:", error);
        setError(`Failed to connect to ICP network: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    initAgent();
  }, []);

  // Refresh user data when switching to my-prompts page
  useEffect(() => {
    if (currentPage === "my-prompts" && isAuthenticated && user) {
      const refreshUserData = async () => {
        try {
          // Refresh user prompts
          const userPromptsRes = await icpAgent.getUserPrompts(user.id);
          if (userPromptsRes?.success && userPromptsRes?.data) {
            setUserPrompts(
              Array.isArray(userPromptsRes.data[0])
                ? userPromptsRes.data[0]
                : []
            );
          }

          // Refresh user purchases
          const userPurchasesRes = await icpAgent.getUserPurchases(user.id);
          if (userPurchasesRes?.success && userPurchasesRes?.data) {
            const purchasedIds = Array.isArray(userPurchasesRes.data[0])
              ? userPurchasesRes.data[0]
              : [];
            // Fetch full prompt objects for each ID
            const purchasedPrompts = [];
            for (const id of purchasedIds) {
              try {
                const promptRes = await icpAgent.getPrompt(id);
                if (
                  promptRes?.success &&
                  promptRes?.data &&
                  promptRes.data[0]
                ) {
                  purchasedPrompts.push(promptRes.data[0]);
                }
              } catch (e) {
                // Ignore errors for missing prompts
              }
            }
            setUserPurchases(purchasedPrompts);
          }
        } catch (err) {
          console.error("Failed to refresh user data:", err);
        }
      };

      refreshUserData();
    }
  }, [currentPage, isAuthenticated, user]);

  const loadInitialData = async () => {
    try {
      if (!icpAgent.isAuthenticated) {
        // Only fetch public prompts, skip user logic
        const publicRes = await icpAgent.getPublicPrompts();
        setPrompts(publicRes?.data?.[0] || []);
        return;
      }

      // ✅ Authenticated path
      const userResponse = await icpAgent.getCurrentUser();
      let userData = userResponse?.data?.[0];

      if (!userResponse?.success || !userData) {
        // New user - prompt for name and email during signup
        let name = "";
        let email = "";

        while (!name.trim()) {
          name = prompt("Enter your name (required):");
          if (name === null) break; // User cancelled
          name = name.trim();
        }

        if (name) {
          email = prompt("Enter your email (optional):");
          if (email === null) email = "";

          const createUserResponse = await icpAgent.createUser(
            name,
            email || null
          );

          if (createUserResponse.success) {
            userData = createUserResponse.data?.[0];
            setUser(userData);
          } else {
            console.error("User creation failed:", createUserResponse.error);
          }
        }
      } else {
        // Existing user - check if username is missing
        setUser(userData);

        if (!userData?.username) {
          let newName = "";
          while (!newName.trim()) {
            newName = prompt("Please enter your name:");
            if (newName === null) break;
            newName = newName.trim();
          }
          if (newName) {
            const updateRes = await icpAgent.updateUsername(newName);
            if (updateRes.success && updateRes.data && updateRes.data[0]) {
              setUser(updateRes.data[0]);
              userData = updateRes.data[0];
            }
          }
        }
      }

      // Load user's created prompts
      if (userData) {
        try {
          const userPromptsRes = await icpAgent.getUserPrompts(userData.id);
          if (userPromptsRes?.success && userPromptsRes?.data) {
            setUserPrompts(
              Array.isArray(userPromptsRes.data[0])
                ? userPromptsRes.data[0]
                : []
            );
          }
        } catch (err) {
          console.error("Failed to load user prompts:", err);
        }

        // Load user's purchased prompts
        try {
          const userPurchasesRes = await icpAgent.getUserPurchases(userData.id);
          if (userPurchasesRes?.success && userPurchasesRes?.data) {
            const purchasedIds = Array.isArray(userPurchasesRes.data[0])
              ? userPurchasesRes.data[0]
              : [];
            // Fetch full prompt objects for each ID
            const purchasedPrompts = [];
            for (const id of purchasedIds) {
              try {
                const promptRes = await icpAgent.getPrompt(id);
                if (
                  promptRes?.success &&
                  promptRes?.data &&
                  promptRes.data[0]
                ) {
                  purchasedPrompts.push(promptRes.data[0]);
                }
              } catch (e) {
                // Ignore errors for missing prompts
              }
            }
            setUserPurchases(purchasedPrompts);
          }
        } catch (err) {
          console.error("Failed to load user purchases:", err);
        }
      }

      const publicRes = await icpAgent.getPublicPrompts();
      setPrompts(publicRes?.data?.[0] || []);
    } catch (err) {
      console.error("Error loading initial data:", err);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      if (!icpAgent?.login) {
        throw new Error("ICP login unavailable");
      }

      await icpAgent.login();
      setIsAuthenticated(icpAgent.isAuthenticated);

      if (icpAgent.isAuthenticated) {
        // Let loadInitialData handle user check + prompting
        await loadInitialData();
      } else {
        setError("Login was cancelled or failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Unknown login error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (icpAgent?.logout) {
        await icpAgent.logout();
      }

      setIsAuthenticated(false);
      setUser(null);
      setUserPurchases([]);
      setUserPrompts([]);
      setError("");

      // Reload public data only
      await loadInitialData();
    } catch (error) {
      console.error("Logout failed:", error);
      setError(`Logout failed: ${error.message}`);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError("");

      if (!icpAgent || typeof icpAgent.searchPrompts !== "function") {
        // Fallback to client-side filtering if search is not available
        setLoading(false);
        return;
      }

      const response = await icpAgent.searchPrompts(
        searchQuery,
        selectedCategory || null
      );
      if (response && response.success && response.data) {
        setPrompts(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response?.error || "Search failed");
      }
    } catch (error) {
      console.error("Search error:", error);
      setError(`Search failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (promptId) => {
    if (!isAuthenticated) {
      setError("Please login to purchase prompts");
      return;
    }

    try {
      setError("");
      const response = await icpAgent.purchasePrompt(promptId);
      if (response && response.success) {
        alert("Purchase successful!");
        // Refresh data
        await loadInitialData();
        // Also refresh user purchases specifically
        if (user) {
          try {
            const userPurchasesRes = await icpAgent.getUserPurchases(user.id);
            if (userPurchasesRes?.success && userPurchasesRes?.data) {
              const purchasedIds = Array.isArray(userPurchasesRes.data[0])
                ? userPurchasesRes.data[0]
                : [];
              // Fetch full prompt objects for each ID
              const purchasedPrompts = [];
              for (const id of purchasedIds) {
                try {
                  const promptRes = await icpAgent.getPrompt(id);
                  if (
                    promptRes?.success &&
                    promptRes?.data &&
                    promptRes.data[0]
                  ) {
                    purchasedPrompts.push(promptRes.data[0]);
                  }
                } catch (e) {
                  // Ignore errors for missing prompts
                }
              }
              setUserPurchases(purchasedPrompts);
            }
          } catch (err) {
            console.error("Failed to refresh user purchases:", err);
          }
        }
      } else {
        alert("Purchase failed: " + (response?.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Purchase error: " + error.message);
    }
  };

  const handleLike = async (promptId) => {
    if (!isAuthenticated) {
      setError("Please login to like prompts");
      return;
    }

    try {
      setError("");
      const response = await icpAgent.likePrompt(promptId);
      if (response && response.success) {
        // Refresh prompts to show updated like count
        const promptsResponse = await icpAgent.getPublicPrompts();
        if (
          promptsResponse &&
          promptsResponse.success &&
          promptsResponse.data
        ) {
          setPrompts(
            Array.isArray(promptsResponse.data) ? promptsResponse.data : []
          );
        }
      } else {
        setError(response?.error || "Failed to like prompt");
      }
    } catch (error) {
      console.error("Like error:", error);
      setError(`Failed to like prompt: ${error.message}`);
    }
  };

  const handleCreatePrompt = async (promptData) => {
    if (!isAuthenticated) {
      setError("Please login to create prompts");
      return;
    }

    try {
      setError("");
      const response = await icpAgent.createPrompt(promptData);
      if (response && response.success) {
        alert("Prompt created successfully!");
        // Refresh data
        await loadInitialData();
        // Also refresh user data specifically
        if (user) {
          try {
            const userPromptsRes = await icpAgent.getUserPrompts(user.id);
            if (userPromptsRes?.success && userPromptsRes?.data) {
              setUserPrompts(
                Array.isArray(userPromptsRes.data[0])
                  ? userPromptsRes.data[0]
                  : []
              );
            }
          } catch (err) {
            console.error("Failed to refresh user prompts:", err);
          }
        }
      } else {
        alert(
          "Failed to create prompt: " + (response?.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Create prompt error:", error);
      alert("Error creating prompt: " + error.message);
    }
  };

  const filteredPrompts = prompts.filter((prompt) => {
    if (!prompt) return false;

    const matchesSearch =
      !searchQuery ||
      (prompt.title &&
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (prompt.description &&
        prompt.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (prompt.tags &&
        Array.isArray(prompt.tags) &&
        prompt.tags.some(
          (tag) => tag && tag.toLowerCase().includes(searchQuery.toLowerCase())
        ));

    const matchesCategory =
      !selectedCategory || prompt.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const isPromptPurchased = (promptId) => {
    return userPurchases.some(
      (prompt) => Number(prompt.id) === Number(promptId)
    );
  };

  const isPromptOwned = (prompt) => {
    if (!isAuthenticated || !prompt || !icpAgent.getPrincipal) return false;
    try {
      const userPrincipal = icpAgent.getPrincipal();
      return (
        userPrincipal &&
        prompt.author &&
        getPrincipalString(userPrincipal) === getPrincipalString(prompt.author)
      );
    } catch (error) {
      console.warn("Error checking prompt ownership:", error);
      return false;
    }
  };

  const safeGetUserStat = (stat, defaultValue = 0) => {
    if (!user || !user[stat]) return defaultValue;
    const value = Number(user[stat]);
    return isNaN(value) ? defaultValue : value;
  };

  // Add a handler to open prompt detail
  const handlePromptClick = (promptId) => {
    setSelectedPromptId(promptId);
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
      <Header
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isAuthenticated={icpAgent.isAuthenticated}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onCreateClick={() => setIsCreateModalOpen(true)}
        getPrincipalString={getPrincipalString}
        icpAgent={icpAgent}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === "marketplace" && (
          <>
            <SearchFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              onSearch={handleSearch}
              PromptCategory={PromptCategory}
            />

            <Marketplace
              filteredPrompts={filteredPrompts}
              onPromptClick={handlePromptClick}
              onPurchase={handlePurchase}
              onLike={handleLike}
              isPromptPurchased={isPromptPurchased}
              isPromptOwned={isPromptOwned}
              getPrincipalString={getPrincipalString}
            />
          </>
        )}

        {currentPage === "my-prompts" && (
          <MyPrompts
            userPrompts={userPrompts}
            userPurchases={userPurchases}
            onPromptClick={handlePromptClick}
            onPurchase={handlePurchase}
            onLike={handleLike}
            isPromptPurchased={isPromptPurchased}
            isPromptOwned={isPromptOwned}
            user={user}
            getPrincipalString={getPrincipalString}
            icpAgent={icpAgent}
          />
        )}
      </main>

      {/* Create Prompt Modal */}
      <CreatePromptModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreatePrompt={handleCreatePrompt}
        PromptCategory={PromptCategory}
      />

      {/* Prompt Detail Modal */}
      {selectedPromptId && (
        <PromptDetail
          promptId={selectedPromptId}
          onClose={() => setSelectedPromptId(null)}
          actor={icpAgent.actor}
          user={user}
        />
      )}
    </div>
  );
}

export default App;
