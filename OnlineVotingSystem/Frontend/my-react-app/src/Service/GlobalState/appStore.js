// src/state/appStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAppStore = create( persist(
    (set) => ({
        me: null,            // { id, email, role, organizationId }
        election: null,      // { id, name, ... } or minimal { id, name }

        setMe: (me) => set({ me }),
        clearMe: () => set({ me: null }),

        setElection: (election) => set({ election }),
        clearElection: () => set({ election: null }),
    }),
    {
        name: "ovs_app_session",          // key in sessionStorage
        version: 1,
        storage: createJSONStorage(() => sessionStorage),
        // Persist only what should survive refresh-in-tab
        partialize: (state) => ({
            me: state.me,          // optional: keep user too, or remove if you prefer
            election: state.election,
        }),
    }));
