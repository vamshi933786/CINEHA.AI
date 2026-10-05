"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "@/lib/api";
import type {
  CreatorProfile,
  CreatorProfileData,
  ProfileContainerResponse,
  PersonaPreviewResponse,
} from "@/types/creatorProfile";

interface CreatorProfileContextType {
  profile: CreatorProfile | null;
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  saveProfile: (data: CreatorProfileData) => Promise<ProfileContainerResponse>;
  generatePersonaSummary: (data?: CreatorProfileData) => Promise<PersonaPreviewResponse>;
}

const CreatorProfileContext = createContext<CreatorProfileContextType | null>(
  null
);

export function CreatorProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getProfile();
      setProfile(response.profile);
      setIsConfigured(response.is_configured);
    } catch (err: any) {
      setError(err.message || "Failed to load creator profile.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const saveProfile = useCallback(
    async (data: CreatorProfileData): Promise<ProfileContainerResponse> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.updateProfile(data);
        setProfile(response.profile);
        setIsConfigured(response.is_configured);
        return response;
      } catch (err: any) {
        const msg = err.message || "Failed to save profile.";
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const generatePersonaSummary = useCallback(
    async (data?: CreatorProfileData): Promise<PersonaPreviewResponse> => {
      return await api.generatePersonaSummary(data);
    },
    []
  );

  return (
    <CreatorProfileContext.Provider
      value={{
        profile,
        isConfigured,
        isLoading,
        error,
        refreshProfile,
        saveProfile,
        generatePersonaSummary,
      }}
    >
      {children}
    </CreatorProfileContext.Provider>
  );
}

export function useCreatorProfile(): CreatorProfileContextType {
  const context = useContext(CreatorProfileContext);
  if (!context) {
    throw new Error(
      "useCreatorProfile must be used within a CreatorProfileProvider"
    );
  }
  return context;
}
