# 🧠 PromptVault

PromptVault is a decentralized marketplace for buying and selling high-quality AI prompts, powered by the Internet Computer (ICP). Users can log in using Internet Identity, explore public prompts, purchase premium content, and create or monetize their own prompts.

---

## 🚀 Features

- 🔐 Internet Identity login
- 📦 Public and premium AI prompt marketplace
- 🧾 User profiles with earnings/spending stats
- 💸 ICP-based prompt purchases
- ❤️ Like prompts, track popularity
- ✍️ Add custom tags, categories, and descriptions
- ⚙️ Built with React + DFINITY (Motoko backend)

---

## 🛠 Tech Stack

- **Frontend**: React (Vite)
- **Backend**: DFINITY Canister (Motoko or Rust)
- **Identity**: Internet Identity via `@dfinity/auth-client`
- **Agent/Actor**: DFINITY SDK `@dfinity/agent`
- **Local Replica**: DFX for local testing

---

## 🧑‍💻 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/promptvault.git
cd promptvault
```

### 2. Install dependencies

```bash
npm install
# or
yarn
```

### 3. Start the local Internet Computer replica

```bash
dfx start --background
```

### 4. Deploy the backend canister

```bash
dfx deploy
```

### 5. Run the frontend

```bash
npm run dev
```

---

## 🔐 Internet Identity Setup

1. Deploy the Internet Identity canister if you're using it locally:

```bash
dfx deps deploy internet_identity
```

2. Update the `.env` file:

```env
VITE_BACKEND_CANISTER_ID=uxrrr-q7777-77774-qaaaq-cai
VITE_INTERNET_IDENTITY_CANISTER_ID=umunu-kh777-77774-qaaca-cai
```

3. The login flow uses Internet Identity via `@dfinity/auth-client`.

---

## 🧪 Testing Locally

### Switch Users

```bash
dfx identity new test-user
dfx identity use test-user
```

### Mint ICP or test cycles

```bash
dfx ledger account-id
dfx ledger fabricate-cycles --canister-id <your_canister_id>
```

---

## 📁 Project Structure

```
promptvault/
├── src/
│   ├── App.jsx            # Main React app
│   ├── agent.js           # ICP Agent & actor setup
│   ├── components/        # Prompt cards, login buttons, etc.
│   ├── declarations/      # Auto-generated canister bindings
│   └── styles/            # Tailwind or custom styles
├── backend/               # Motoko or Rust backend canister code
├── .env                   # Environment config
└── README.md
```

---

## 🧩 Future Improvements

- Wallet UI integration (Plug or Stoic)
- Profile management & avatars
- Ratings & reviews
- Search filters and sorting
- Analytics for prompt authors

---

## 📜 License

MIT License. PromptVault is open-source and free to use.

---

## 🙌 Acknowledgements

Built on the Internet Computer using DFINITY SDK & Internet Identity.
