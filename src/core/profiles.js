export const PROFILE_REGISTRY_VERSION = '1.0';

const PROFILE_DEFINITIONS = {
  'managed-coding-agent': {
    id: 'managed-coding-agent',
    version: '1.0',
    label: 'Managed coding agent (experimental)',
    description: 'Experimental capability profile for a managed coding harness that already exposes workspace context and a native tool loop.',
    status: 'experimental',
    evidenceState: 'not_evaluated',
    default: false,
    compatibleTargets: ['agent'],
    capabilities: {
      nativeToolLoop: true,
      nativeReasoningControl: false,
      memoryCompaction: false,
      outputSchemaSupport: false,
      executionVerificationScaffold: false,
    },
    suppressTargetInstructions: [
      'Inspect the available context and tools before changing anything.',
    ],
    addTargetInstructions: [],
  },
};

function cloneProfile(profile) {
  if (!profile) return null;
  return {
    ...profile,
    compatibleTargets: [...profile.compatibleTargets],
    capabilities: { ...profile.capabilities },
    suppressTargetInstructions: [...profile.suppressTargetInstructions],
    addTargetInstructions: [...profile.addTargetInstructions],
  };
}

export function getHarnessProfile(id) {
  if (!id) return null;
  return cloneProfile(PROFILE_DEFINITIONS[id]);
}

export function listHarnessProfiles() {
  return Object.values(PROFILE_DEFINITIONS).map(cloneProfile);
}

export function applyHarnessProfile(target, instructions, profileId) {
  if (!profileId) return [...instructions];
  const profile = PROFILE_DEFINITIONS[profileId];
  if (!profile || !profile.compatibleTargets.includes(target)) return [...instructions];
  const suppressed = new Set(profile.suppressTargetInstructions);
  return [
    ...instructions.filter((instruction) => !suppressed.has(instruction)),
    ...profile.addTargetInstructions,
  ];
}
