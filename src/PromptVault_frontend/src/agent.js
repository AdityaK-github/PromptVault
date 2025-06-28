// src/agent.js - ICP Agent setup
import { Actor, HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import {
  createActor,
  canisterId as backendCanisterId,
} from "../../declarations/PromptVault_backend";

// Pull values from Vite's environment variables
const CANISTER_ID = import.meta.env.VITE_CANISTER_ID;
const INTERNET_IDENTITY_CANISTER_ID = import.meta.env
  .VITE_INTERNET_IDENTITY_CANISTER_ID;
const LOCAL_REPLICA_URL = "http://127.0.0.1:4943";

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
      this.authClient = await AuthClient.create();
      this.isAuthenticated = await this.authClient.isAuthenticated();
      this.identity = this.authClient.getIdentity();

      this.agent = new HttpAgent({
        host: LOCAL_REPLICA_URL,
        identity: this.isAuthenticated ? this.identity : undefined,
      });

      if (import.meta.env.MODE !== "production") {
        await this.agent.fetchRootKey(); // Local only
      }

      this.actor = createActor(CANISTER_ID, { agent: this.agent });

      console.log("ICP Agent initialized");
      return true;
    } catch (error) {
      console.error("ICP Agent init failed:", error);
      return false;
    }
  }

  async login() {
    try {
      return new Promise((resolve, reject) => {
        this.authClient.login({
          identityProvider:
            import.meta.env.MODE === "production"
              ? "https://identity.ic0.app"
              : `http://${
                  import.meta.env.VITE_INTERNET_IDENTITY_CANISTER_ID
                }.localhost:4943`,
          onSuccess: async () => {
            try {
              this.isAuthenticated = true;
              this.identity = this.authClient.getIdentity();

              this.agent = new HttpAgent({
                host: LOCAL_REPLICA_URL,
                identity: this.identity,
              });

              if (import.meta.env.MODE !== "production") {
                await this.agent.fetchRootKey();
              }

              this.actor = createActor(backendCanisterId, {
                agent: this.agent,
              });

              console.log("✅ Logged in successfully");
              resolve(true);
            } catch (e) {
              console.error("Login post-setup failed:", e);
              reject(e);
            }
          },
          onError: (err) => {
            console.error("❌ Login popup failed:", err);
            reject(err);
          },
        });
      });
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  async logout() {
    await this.authClient.logout();
    this.isAuthenticated = false;
    this.identity = null;
    await this.init(); // Go back to anonymous
  }

  getPrincipal() {
    return this.identity?.getPrincipal()?.toString() || null;
  }

  // ---------- Canister API Wrappers ----------

  async createUser(username, email) {
    if (!this.isAuthenticated) throw new Error("Authentication required");
    return this.actor.create_user(
      username ? [username] : [],
      email ? [email] : []
    );
  }

  async getCurrentUser() {
    if (!this.isAuthenticated)
      return { success: false, error: "Not authenticated" };
    return this.actor.get_user(this.identity.getPrincipal());
  }

  async getUser(userId) {
    return this.actor.get_user(userId);
  }

  async createPrompt(data) {
    if (!this.isAuthenticated) throw new Error("Authentication required");

    const request = {
      title: data.title,
      description: data.description,
      content: data.content,
      category: { [data.category]: null },
      tags: data.tags,
      price: BigInt(data.price),
      is_premium: data.is_premium,
      is_public: data.is_public,
    };

    return this.actor.create_prompt(request);
  }

  async getPublicPrompts() {
    return this.actor.get_public_prompts();
  }

  async searchPrompts(query, category) {
    const categoryVariant = category ? { [category]: null } : [];
    return this.actor.search_prompts(query, categoryVariant);
  }

  async purchasePrompt(promptId) {
    if (!this.isAuthenticated) throw new Error("Authentication required");
    return this.actor.purchase_prompt(BigInt(promptId));
  }

  async likePrompt(promptId) {
    if (!this.isAuthenticated) throw new Error("Authentication required");
    return this.actor.like_prompt(BigInt(promptId));
  }

  async getUserPurchases(userId) {
    const principal = userId || this.identity.getPrincipal();
    return this.actor.get_user_purchases(principal);
  }

  async getUserPrompts(userId) {
    const principal = userId || this.identity.getPrincipal();
    return this.actor.get_user_prompts(principal);
  }

  async getPromptContent(promptId) {
    return this.actor.get_prompt_content(BigInt(promptId));
  }

  async updateUsername(newUsername) {
    if (!this.isAuthenticated) throw new Error("Authentication required");
    return this.actor.update_username(newUsername);
  }

  async updatePrompt(request) {
    if (!this.isAuthenticated) throw new Error("Authentication required");
    return this.actor.update_prompt(request);
  }

  async deletePrompt(promptId) {
    if (!this.isAuthenticated) throw new Error("Authentication required");
    return this.actor.delete_prompt(BigInt(promptId));
  }

  async unlikePrompt(promptId) {
    if (!this.isAuthenticated) throw new Error("Authentication required");
    return this.actor.unlike_prompt(BigInt(promptId));
  }

  async ratePrompt(request) {
    if (!this.isAuthenticated) throw new Error("Authentication required");
    return this.actor.rate_prompt(request);
  }

  async getPrompt(promptId) {
    return this.actor.get_prompt(BigInt(promptId));
  }

  async getUserBalance(userId) {
    const principal = userId || this.identity.getPrincipal();
    return this.actor.get_user_balance(principal);
  }

  async getUserLedgerBalance(userId) {
    const principal = userId || this.identity.getPrincipal();
    return this.actor.get_user_ledger_balance(principal);
  }
}

const icpAgent = new ICPAgent();
export default icpAgent;
