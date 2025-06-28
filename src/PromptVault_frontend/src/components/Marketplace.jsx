import React from "react";
import PromptCard from "./PromptCard";

const Marketplace = ({
  filteredPrompts,
  onPromptClick,
  onPurchase,
  onLike,
  isPromptPurchased,
  isPromptOwned,
  getPrincipalString,
}) => {
  return (
    <>
      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrompts.map((prompt, index) => (
          <div
            key={prompt.id || `prompt-${index}`}
            onClick={() => onPromptClick(prompt.id)}
            style={{ cursor: "pointer" }}
          >
            <PromptCard
              prompt={prompt}
              onPurchase={onPurchase}
              onLike={onLike}
              isPurchased={isPromptPurchased(prompt.id)}
              isOwned={isPromptOwned(prompt)}
              getPrincipalString={getPrincipalString}
            />
          </div>
        ))}
      </div>

      {filteredPrompts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No prompts found. Try adjusting your search criteria.
          </p>
        </div>
      )}
    </>
  );
};

export default Marketplace;
