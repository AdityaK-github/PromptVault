import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Actor } from "@dfinity/agent";
import {
  Heart,
  Star,
  ShoppingCart,
  User,
  Calendar,
  Tag,
  DollarSign,
  Eye,
  ThumbsUp,
} from "lucide-react";

const PromptDetail = ({ actor, user, promptId: propPromptId, onClose }) => {
  const params = useParams();
  const promptId = propPromptId || params.promptId;
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  const [rating, setRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [liked, setLiked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [promptContent, setPromptContent] = useState("");

  useEffect(() => {
    if (actor && promptId) {
      fetchPromptDetails();
      checkUserInteractions();
    }
  }, [actor, promptId, user]);

  const fetchPromptDetails = async () => {
    try {
      const response = await actor.get_prompt(parseInt(promptId));
      if (response.success) {
        setPrompt(response.data[0]);
        // Try to get content if user has access
        await fetchPromptContent();
      } else {
        setError(response.error || "Prompt not found");
      }
    } catch (err) {
      setError("Failed to fetch prompt details");
    } finally {
      setLoading(false);
    }
  };

  const fetchPromptContent = async () => {
    try {
      const response = await actor.get_prompt_content(parseInt(promptId));
      if (response.success) {
        setPromptContent(response.data);
        setHasAccess(true);
      }
    } catch (err) {
      // User doesn't have access to content
      setHasAccess(false);
    }
  };

  const checkUserInteractions = async () => {
    if (!user) return;

    try {
      // Check if user has purchased this prompt
      const purchasesResponse = await actor.get_user_purchases(user.id);
      if (purchasesResponse.success) {
        const hasPurchased = purchasesResponse.data.includes(
          parseInt(promptId)
        );
        setHasAccess(hasPurchased);
      }
    } catch (err) {
      console.error("Failed to check user interactions:", err);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      alert("Please create an account to purchase prompts");
      return;
    }

    setPurchasing(true);
    try {
      const response = await actor.purchase_prompt(parseInt(promptId));
      if (response.success) {
        alert("Purchase successful!");
        setHasAccess(true);
        await fetchPromptContent();
        await fetchPromptDetails(); // Refresh to update purchase count
      } else {
        alert(response.error || "Purchase failed");
      }
    } catch (err) {
      alert("Purchase failed: " + err.message);
    } finally {
      setPurchasing(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert("Please create an account to like prompts");
      return;
    }

    try {
      const response = liked
        ? await actor.unlike_prompt(parseInt(promptId))
        : await actor.like_prompt(parseInt(promptId));

      if (response.success) {
        setLiked(!liked);
        await fetchPromptDetails(); // Refresh to update like count
      } else {
        alert(response.error || "Action failed");
      }
    } catch (err) {
      alert("Action failed: " + err.message);
    }
  };

  const handleRating = async (newRating) => {
    if (!user) {
      alert("Please create an account to rate prompts");
      return;
    }

    setSubmittingRating(true);
    try {
      const response = await actor.rate_prompt({
        prompt_id: parseInt(promptId),
        rating: newRating,
      });

      if (response.success) {
        setRating(newRating);
        await fetchPromptDetails(); // Refresh to update rating
        alert("Rating submitted successfully!");
      } else {
        alert(response.error || "Rating failed");
      }
    } catch (err) {
      alert("Rating failed: " + err.message);
    } finally {
      setSubmittingRating(false);
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return "0.00000000 ICP";
    const priceNum = typeof price === "bigint" ? Number(price) : price;
    if (isNaN(priceNum)) return "0.00000000 ICP";
    return (priceNum / 100_000_000).toFixed(8) + " ICP";
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    try {
      return new Date(Number(timestamp) / 1_000_000).toLocaleDateString();
    } catch (error) {
      return "Unknown";
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Marketing: "bg-blue-100 text-blue-800",
      Development: "bg-green-100 text-green-800",
      Writing: "bg-purple-100 text-purple-800",
      Business: "bg-yellow-100 text-yellow-800",
      Education: "bg-indigo-100 text-indigo-800",
      Creative: "bg-pink-100 text-pink-800",
      Other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.Other;
  };

  // Helper to safely convert Principal or string to string
  const getPrincipalString = (principal) => {
    if (!principal) return "";
    if (typeof principal === "string") return principal;
    if (typeof principal.toString === "function") return principal.toString();
    return "";
  };

  // Helper to extract category string from Candid variant
  const getCategoryString = (cat) => {
    if (!cat) return "";
    if (typeof cat === "string") return cat;
    if (typeof cat === "object") return Object.keys(cat)[0];
    return "";
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Prompt not found
            </h1>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  const isOwner =
    user &&
    prompt.author &&
    getPrincipalString(prompt.author) === getPrincipalString(user.id);
  const priceNum =
    typeof prompt.price === "bigint" ? Number(prompt.price) : prompt.price;
  const canPurchase = !isOwner && !hasAccess && (priceNum || 0) > 0;
  const canRate = user && !isOwner && (hasAccess || prompt.is_public);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Close Button */}
          {onClose && (
            <div className="flex justify-end mb-4">
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* Header */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {prompt.title || "Untitled Prompt"}
                </h1>
                <p className="text-gray-600 mb-4 text-lg">
                  {prompt.description || "No description available"}
                </p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                {prompt.is_premium && (
                  <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Premium
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${getCategoryColor(
                    getCategoryString(prompt.category) || "Other"
                  )}`}
                >
                  {getCategoryString(prompt.category) || "Other"}
                </span>
              </div>
            </div>

            {/* Useful Stats Row */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-medium">
                  {typeof prompt.rating === "number"
                    ? prompt.rating.toFixed(1)
                    : "0.0"}{" "}
                  / 5.0
                </span>
                <span className="text-gray-500">
                  ({prompt.total_ratings || 0} reviews)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-400 fill-current" />
                <span>{prompt.likes || 0} likes</span>
              </div>
              <div className="flex items-center gap-1">
                <ShoppingCart className="w-4 h-4 text-blue-400" />
                <span>{prompt.purchases || 0} purchases</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4 text-gray-400" />
                <span>{prompt.views || 0} views</span>
              </div>
            </div>

            {/* Tags - only show if meaningful */}
            {prompt.tags &&
              prompt.tags.length > 0 &&
              prompt.tags.some((tag) => tag && tag.trim()) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {prompt.tags
                    .filter((tag) => tag && tag.trim())
                    .map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                </div>
              )}

            {/* Price and Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {(priceNum || 0) === 0 ? "Free" : formatPrice(priceNum || 0)}
                </span>
                {(priceNum || 0) > 0 && (
                  <span className="text-sm text-gray-500">
                    one-time purchase
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                {/* Like Button */}
                {!isOwner && (
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      liked
                        ? "bg-red-50 border-red-300 text-red-600"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${liked ? "fill-current" : ""}`}
                    />
                    {liked ? "Liked" : "Like"}
                  </button>
                )}

                {/* Purchase Button */}
                {canPurchase && (
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {purchasing ? "Purchasing..." : "Buy Now"}
                  </button>
                )}

                {/* Access Status */}
                {hasAccess && !isOwner && (
                  <span className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium">
                    <Eye className="w-4 h-4" />
                    You Own This
                  </span>
                )}

                {isOwner && (
                  <span className="flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium">
                    <User className="w-4 h-4" />
                    Your Creation
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rating Section */}
          {canRate && (
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Rate this prompt</h3>
                <span className="text-sm text-gray-500">
                  Help others by sharing your experience
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      disabled={submittingRating}
                      className={`w-10 h-10 transition-all duration-200 ${
                        star <= rating
                          ? "text-yellow-400 scale-110"
                          : "text-gray-300 hover:text-yellow-300"
                      } disabled:opacity-50`}
                    >
                      <Star className="w-full h-full fill-current" />
                    </button>
                  ))}
                </div>

                <div className="flex flex-col">
                  <span className="text-lg font-medium text-gray-800">
                    {rating > 0 ? `${rating} out of 5 stars` : "Click to rate"}
                  </span>
                  {rating > 0 && (
                    <span className="text-sm text-gray-500">
                      {rating === 1 && "Poor"}
                      {rating === 2 && "Fair"}
                      {rating === 3 && "Good"}
                      {rating === 4 && "Very Good"}
                      {rating === 5 && "Excellent"}
                    </span>
                  )}
                </div>
              </div>

              {submittingRating && (
                <div className="mt-3 text-sm text-blue-600">
                  Submitting your rating...
                </div>
              )}
            </div>
          )}

          {/* Content Section */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Prompt Content</h3>
              {hasAccess && (
                <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  Full Access
                </span>
              )}
            </div>

            {hasAccess || prompt.is_public ? (
              <div className="bg-gray-50 p-6 rounded-lg border">
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Copy this prompt:
                  </h4>
                  <div className="relative">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono bg-white p-4 rounded border overflow-x-auto">
                      {promptContent ||
                        prompt.content ||
                        "No content available"}
                    </pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          promptContent || prompt.content || ""
                        );
                        alert("Prompt copied to clipboard!");
                      }}
                      className="absolute top-2 right-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
                      title="Copy to clipboard"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    💡 <strong>How to use:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Copy the prompt above</li>
                    <li>Paste it into your AI tool (ChatGPT, Claude, etc.)</li>
                    <li>Customize it for your specific needs</li>
                    <li>Enjoy better results with this proven prompt!</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-lg text-center border-2 border-dashed border-blue-200">
                <div className="text-blue-600 mb-4">
                  <Eye className="w-16 h-16 mx-auto mb-3 opacity-60" />
                  <h4 className="text-xl font-semibold mb-2">
                    Content Preview Restricted
                  </h4>
                  <p className="text-blue-700 mb-6">
                    Purchase this prompt to unlock the full content and start
                    using it immediately.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-600 mb-2">What you'll get:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>✓ Complete prompt template</li>
                    <li>✓ Ready-to-use format</li>
                    <li>✓ Lifetime access</li>
                    <li>✓ No recurring fees</li>
                  </ul>
                </div>

                {canPurchase && (
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-lg"
                  >
                    {purchasing
                      ? "Processing..."
                      : `Unlock for ${formatPrice(prompt.price || 0)}`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptDetail;
