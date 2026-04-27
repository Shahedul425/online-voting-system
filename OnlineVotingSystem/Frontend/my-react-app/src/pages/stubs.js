// ============================================================================
// Re-export shim — previously this file shipped placeholder "not yet ported"
// components. All nine pages are now real JSX modules in their own files; this
// shim preserves the `import { Foo } from "../pages/stubs"` call sites so you
// don't have to hunt-and-replace imports.
//
// New code should import directly from the per-page module instead of this
// aggregator.
// ============================================================================

// Voter
export { default as VoterNotifications }    from "./voter/VoterNotifications";

// Admin upload flows + lists
export { default as AdminUploadVoters }     from "./admin/AdminUploadVoters";
export { default as AdminUploadCandidates } from "./admin/AdminUploadCandidates";
export { default as AdminVoterList }        from "./admin/AdminVoterList";
export { default as AdminCandidateList }    from "./admin/AdminCandidateList";

// Super
export { default as SuperDashboard }        from "./super/SuperDashboard";
export { default as SuperOrgs }             from "./super/SuperOrgs";
export { default as SuperCreateOrg }        from "./super/SuperCreateOrg";
export { default as SuperAdmins }           from "./super/SuperAdmins";
