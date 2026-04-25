import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Tenant, User, Feature, RoadmapQuarter, UserRole, Quarter,
  FeatureScores, DimensionWeights, ESGWeights, CompanyValue,
  TenantStage, GTMModel,
} from '../types';
import {
  MOCK_TENANTS, MOCK_USERS, MOCK_FEATURES, MOCK_ROADMAP_QUARTERS,
} from '../data/mockData';
import { calculateCompositeScore } from '../utils/scoring';

interface AppState {
  // Multi-tenancy
  tenants: Tenant[];
  currentTenantId: string;

  // Auth / Role
  users: User[];
  currentUserId: string;
  demoRole: UserRole;

  // Features
  features: Feature[];

  // Roadmap
  roadmapQuarters: RoadmapQuarter[];

  // UI
  scoringFeatureId: string | null;

  // Computed selectors
  currentTenant: () => Tenant;
  currentUser: () => User;
  tenantFeatures: () => Feature[];
  tenantQuarters: () => RoadmapQuarter[];
  tenantUsers: () => User[];

  // Mutations
  setCurrentTenant: (id: string) => void;
  setDemoRole: (role: UserRole) => void;

  addFeature: (feature: Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateFeature: (id: string, updates: Partial<Feature>) => void;
  deleteFeature: (id: string) => void;
  updateFeatureScores: (featureId: string, scores: FeatureScores) => void;
  assignFeatureToQuarter: (featureId: string, quarter: Quarter | null) => void;
  importFeatures: (features: Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>[]) => void;

  updateTenantSettings: (
    updates: Partial<Pick<Tenant, 'name' | 'sector' | 'stage' | 'gtmModel' | 'values' | 'esgWeights' | 'dimensionWeights'>>
  ) => void;

  lockQuarter: (quarterId: string) => void;
  unlockQuarter: (quarterId: string) => void;

  setScoringFeature: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tenants: MOCK_TENANTS,
      currentTenantId: 'tenant-ecotrack',
      users: MOCK_USERS,
      currentUserId: 'user-1',
      demoRole: 'Admin',
      features: MOCK_FEATURES,
      roadmapQuarters: MOCK_ROADMAP_QUARTERS,
      scoringFeatureId: null,

      currentTenant: () => get().tenants.find((t) => t.id === get().currentTenantId)!,
      currentUser: () => {
        const base = get().users.find((u) => u.id === get().currentUserId)!;
        return { ...base, role: get().demoRole };
      },
      tenantFeatures: () =>
        get().features.filter((f) => f.tenantId === get().currentTenantId),
      tenantQuarters: () =>
        get().roadmapQuarters.filter((q) => q.tenantId === get().currentTenantId),
      tenantUsers: () =>
        get().users.filter((u) => u.tenantId === get().currentTenantId),

      setCurrentTenant: (id) => {
        const tenant = get().tenants.find((t) => t.id === id);
        if (!tenant) return;
        const firstUser = get().users.find((u) => u.tenantId === id);
        set({
          currentTenantId: id,
          currentUserId: firstUser?.id ?? get().currentUserId,
          demoRole: firstUser?.role ?? 'Admin',
        });
      },

      setDemoRole: (role) => set({ demoRole: role }),

      addFeature: (feature) => {
        const id = `feat-${Date.now()}`;
        const now = new Date().toISOString();
        set((s) => ({
          features: [...s.features, { ...feature, id, createdAt: now, updatedAt: now }],
        }));
      },

      updateFeature: (id, updates) =>
        set((s) => ({
          features: s.features.map((f) =>
            f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
          ),
        })),

      deleteFeature: (id) =>
        set((s) => ({ features: s.features.filter((f) => f.id !== id) })),

      updateFeatureScores: (featureId, scores) => {
        const state = get();
        const tenant = state.currentTenant();
        const compositeScore = calculateCompositeScore(scores, tenant.dimensionWeights, tenant.esgWeights);
        const updatedScores = { ...scores, compositeScore };
        set((s) => ({
          features: s.features.map((f) =>
            f.id === featureId
              ? { ...f, scores: updatedScores, updatedAt: new Date().toISOString() }
              : f
          ),
        }));
      },

      assignFeatureToQuarter: (featureId, quarter) =>
        set((s) => ({
          features: s.features.map((f) =>
            f.id === featureId ? { ...f, quarter, updatedAt: new Date().toISOString() } : f
          ),
        })),

      importFeatures: (features) => {
        const now = new Date().toISOString();
        const newFeatures = features.map((f, i) => ({
          ...f,
          id: `feat-imported-${Date.now()}-${i}`,
          createdAt: now,
          updatedAt: now,
        }));
        set((s) => ({ features: [...s.features, ...newFeatures] }));
      },

      updateTenantSettings: (updates) =>
        set((s) => ({
          tenants: s.tenants.map((t) =>
            t.id === s.currentTenantId ? { ...t, ...updates } : t
          ),
        })),

      lockQuarter: (quarterId) =>
        set((s) => ({
          roadmapQuarters: s.roadmapQuarters.map((q) =>
            q.id === quarterId
              ? { ...q, locked: true, lockedBy: s.currentUserId, lockedAt: new Date().toISOString() }
              : q
          ),
        })),

      unlockQuarter: (quarterId) =>
        set((s) => ({
          roadmapQuarters: s.roadmapQuarters.map((q) =>
            q.id === quarterId ? { ...q, locked: false, lockedBy: undefined, lockedAt: undefined } : q
          ),
        })),

      setScoringFeature: (id) => set({ scoringFeatureId: id }),
    }),
    {
      name: 'sotari-state',
      partialize: (s) => ({
        currentTenantId: s.currentTenantId,
        currentUserId: s.currentUserId,
        demoRole: s.demoRole,
        features: s.features,
        roadmapQuarters: s.roadmapQuarters,
        tenants: s.tenants,
      }),
    }
  )
);
