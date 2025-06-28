import React from "react";
import { Plus, User, LogIn, LogOut } from "lucide-react";

const Header = ({
  currentPage,
  setCurrentPage,
  isAuthenticated,
  user,
  onLogin,
  onLogout,
  onCreateClick,
  getPrincipalString,
  icpAgent,
}) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-900">Prompt Vault</h1>

            <nav className="flex space-x-6">
              <button
                onClick={() => setCurrentPage("marketplace")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === "marketplace"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Marketplace
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => setCurrentPage("my-prompts")}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === "my-prompts"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
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
                  onClick={onCreateClick}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={18} />
                  Create
                </button>

                <div className="flex items-center space-x-2 text-sm">
                  <User size={18} className="text-gray-500" />
                  <span className="font-medium">
                    {user?.username ||
                      (icpAgent.getPrincipal &&
                        getPrincipalString(icpAgent.getPrincipal())?.slice(
                          0,
                          8
                        ) + "...") ||
                      "User"}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={onLogin}
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
  );
};

export default Header;
