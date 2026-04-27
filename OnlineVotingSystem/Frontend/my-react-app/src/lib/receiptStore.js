// Holds the last receipt in sessionStorage so VoteSubmitted / VoterReceipt
// can show it after castVote returns. Mirrors the prototype's STATE.lastReceipt.
const KEY = "ovs_last_receipt";

export const ReceiptStore = {
  get() {
    try {
      const s = sessionStorage.getItem(KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  },
  set(r) {
    try { sessionStorage.setItem(KEY, JSON.stringify(r)); } catch { /* noop */ }
  },
  clear() {
    try { sessionStorage.removeItem(KEY); } catch { /* noop */ }
  },
};
