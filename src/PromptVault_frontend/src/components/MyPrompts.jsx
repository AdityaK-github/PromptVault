import React from "react";
import PromptCard from "./PromptCard";
import UserBalance from "../UserBalance";

const MyPrompts = ({
  userPrompts,
  userPurchases,
  onPromptClick,
  onPurchase,
  onLike,
  isPromptPurchased,
  isPromptOwned,
  user,
  getPrincipalString,
  icpAgent,
}) => {
  // Filter out invalid/blank prompts
  const validUserPrompts = (
    Array.isArray(userPrompts) ? userPrompts : []
  ).filter((p) => p && p.title && p.description);
  const validUserPurchases = (
    Array.isArray(userPurchases) ? userPurchases : []
  ).filter((p) => p && p.title && p.description);

  return (
    <div className="space-y-8">
      {/* User Balance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">My Account</h2>
        <UserBalance user={user} icpAgent={icpAgent} />
      </div>

      {/* My Created Prompts */}
      <div>
        <h2 className="text-xl font-semibold mb-4">My Created Prompts</h2>
        {validUserPrompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {validUserPrompts.map((prompt, index) => (
              <div
                key={prompt.id || `user-prompt-${index}`}
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
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              You haven't created any prompts yet.
            </p>
          </div>
        )}
      </div>

      {/* My Purchased Prompts */}
      <div>
        <h2 className="text-xl font-semibold mb-4">My Purchased Prompts</h2>
        {validUserPurchases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {validUserPurchases.map((prompt, index) => (
              <div
                key={prompt.id || `purchased-prompt-${index}`}
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
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              You haven't purchased any prompts yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPrompts;
