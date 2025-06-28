import React from "react";
import { Heart, Star, DollarSign, Eye } from "lucide-react";

// Helper to extract category string from Candid variant
const getCategoryString = (cat) => {
  if (!cat) return "";
  if (typeof cat === "string") return cat;
  if (typeof cat === "object") return Object.keys(cat)[0];
  return "";
};

const PromptCard = ({
  prompt,
  onPurchase,
  onLike,
  isPurchased,
  isOwned,
  getPrincipalString,
}) => {
  const handlePurchase = (e) => {
    e.stopPropagation();
    onPurchase(prompt.id);
  };

  const handleLike = (e) => {
    e.stopPropagation();
    onLike(prompt.id);
  };

  // Refined card UI and safe fallbacks
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-200 border border-gray-200 flex flex-col h-full">
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {prompt.title || "Untitled Prompt"}
          </h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {getCategoryString(prompt.category) || "Other"}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {prompt.description || "No description available"}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Star size={16} className="text-yellow-400 fill-current" />
              <span>
                {typeof prompt.rating === "number"
                  ? prompt.rating.toFixed(1)
                  : "0.0"}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart size={16} className="text-red-400 fill-current" />
              <span>{prompt.likes || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye size={16} />
              <span>{prompt.views || 0}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-green-600 font-semibold">
            <DollarSign size={16} />
            <span>
              {(prompt.price ? Number(prompt.price) / 100000000 : 0).toFixed(2)}{" "}
              ICP
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="text-xs text-gray-500">
            by{" "}
            {prompt.author && getPrincipalString
              ? getPrincipalString(prompt.author)
              : "Unknown"}
          </div>

          <div className="flex space-x-2">
            {!isOwned && (
              <button
                onClick={handleLike}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Like"
              >
                <Heart
                  size={16}
                  className={prompt.liked ? "text-red-500 fill-current" : ""}
                />
              </button>
            )}

            {!isOwned && !isPurchased && (
              <button
                onClick={handlePurchase}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                title="Buy"
              >
                Buy
              </button>
            )}

            {(isOwned || isPurchased) && (
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm">
                {isOwned ? "Owned" : "Purchased"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptCard;
