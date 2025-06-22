"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import user from "@/assets/user.jpg";
import {
  Bell,
  BookOpen,
  Edit,
  Lock,
  LogOut,
  MessageSquare,
  Shield,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch, useAuth } from "@/store/hooks";
import { 
  getUserProfile, 
  updateUserProfile, 
  logoutUser, 
  clearError 
} from "@/store/slices/authSlice";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsAsRead
} from "@/store/slices/notificationSlice";
import type { RootState } from "@/store";
import { useAppSelector } from "@/store/hooks";

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user: currentUser, isLoading, error } = useAuth();
  
  // Notification state from Redux
  const notifications = useAppSelector((state: RootState) => state.notifications?.notifications || []);
  const notificationLoading = useAppSelector((state: RootState) => state.notifications?.loading?.fetchNotifications || false);
  const unreadCount = useAppSelector((state: RootState) => state.notifications?.unreadCount || 0);
  
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Form states - initialize with Redux user data
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    bio: "",
    avatar: null as File | null,
  });

  // State for handling avatar image loading errors
  const [avatarError, setAvatarError] = useState(false);

  const [preferences, setPreferences] = useState({
    showProfile: true,
    allowMessages: true,
    emailNotifications: false,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    commentNotifications: true,
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
  });

  // Load user profile on component mount
  useEffect(() => {
    if (!currentUser) {
      dispatch(getUserProfile());
    }
  }, [dispatch, currentUser]);

  // Update form data when user data changes
  useEffect(() => {
    if (currentUser) {
      setUserData({
        name: currentUser.name || "",
        email: currentUser.email || "",
        bio: currentUser.bio || "",
        avatar: null,
      });
      // Reset avatar error when user data changes
      setAvatarError(false);
    }
  }, [currentUser]);

  // Clear any errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Fetch notifications when notifications tab is active
  useEffect(() => {
    if (activeTab === "notifications") {
      dispatch(fetchNotifications({ page: 1, per_page: 10 }));
    }
  }, [activeTab, dispatch]);

  // Fetch unread count on mount
  useEffect(() => {
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  // Handle form changes
  const handleUserDataChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUserData((prev) => ({ ...prev, avatar: file }));
    }
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityData((prev) => ({ ...prev, [name]: value }));
  };

  // Form submission handlers
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const updatePayload: Record<string, string | File> = {};
      
      if (userData.name !== currentUser?.name) {
        updatePayload.name = userData.name;
      }
      if (userData.bio !== currentUser?.bio) {
        updatePayload.bio = userData.bio;
      }
      if (userData.avatar) {
        updatePayload.avatar = userData.avatar;
      }

      // Only update if there are changes
      if (Object.keys(updatePayload).length > 0) {
        await dispatch(updateUserProfile(updatePayload)).unwrap();
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        setIsEditing(false);
        setUserData(prev => ({ ...prev, avatar: null })); // Reset avatar file input
      } else {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate passwords
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert("Passwords don&apos;t match!");
      return;
    }
    if (securityData.newPassword.length < 8) {
      alert("Password must be at least 8 characters!");
      return;
    }

    // TODO: Implement password update endpoint in authService
    // For now, simulate password update
    alert("Password update functionality will be available in a future update.");
    setSecurityData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      twoFactorEnabled: securityData.twoFactorEnabled,
    });
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      router.push("/auth/login");
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, redirect to login
      router.push("/auth/login");
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <User className="w-5 h-5" /> },
    {
      id: "activity",
      label: "Activity",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="w-5 h-5" />,
    },
    { id: "security", label: "Security", icon: <Lock className="w-5 h-5" /> },
  ];

  // Show loading state while fetching user data
  if (isLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-auto">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1d2b7d]"></div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if no user data
  if (!currentUser && !isLoading) {
    router.push("/auth/login");
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        function handleToggleChange<T>(
                  key: keyof T,
                  setPreferences: React.Dispatch<React.SetStateAction<T>>
                ): void {
                  setPreferences((prev) => ({
                    ...prev,
                    [key]: !prev[key],
                  }));
                }
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {showSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <strong className="font-bold">Success!</strong>
                <span className="block sm:inline">
                  {" "}
                  Your profile has been updated.
                </span>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {error}</span>
                <button
                  onClick={() => dispatch(clearError())}
                  className="absolute top-0 bottom-0 right-0 px-4 py-3"
                >
                  ×
                </button>
              </motion.div>
            )}

            <motion.div
              className="bg-white rounded-xl shadow-md p-6"
              whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleProfileSubmit}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Personal Information
                  </h3>
                  <motion.button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-[#1d2b7d] hover:text-[#162058] font-medium flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isLoading}
                  >
                    <Edit className="w-4 h-4" />
                    {isEditing ? "Cancel" : "Edit"}
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Full Name
                      </label>
                      <Input
                        type="text"
                        name="name"
                        value={userData.name}
                        onChange={handleUserDataChange}
                        disabled={!isEditing || isLoading}
                        className="w-full px-4 py-2 border rounded-lg focus:border-[#1d2b7d] focus:outline-none text-black disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        name="email"
                        value={userData.email}
                        onChange={handleUserDataChange}
                        disabled={true} // Email typically shouldn't be editable
                        className="w-full px-4 py-2 border rounded-lg focus:border-[#1d2b7d] focus:outline-none text-black disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    {isEditing && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          Profile Picture
                        </label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="w-full px-4 py-2 border rounded-lg focus:border-[#1d2b7d] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">
                        Bio
                      </label>
                      <Textarea
                        name="bio"
                        rows={5}
                        value={userData.bio}
                        onChange={handleUserDataChange}
                        disabled={!isEditing || isLoading}
                        placeholder="Tell us about yourself..."
                        className="w-full px-4 py-2 border rounded-lg focus:border-[#1d2b7d] focus:outline-none text-black disabled:bg-gray-50 disabled:text-gray-500"
                      ></Textarea>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <motion.div
                    className="mt-6 flex justify-end"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      className="bg-[#1d2b7d] hover:bg-[#162058] text-white font-medium py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </motion.button>
                  </motion.div>
                )}
              </form>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl shadow-md p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Community Preferences
              </h3>
              <div className="space-y-4">
                <motion.div
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
                >
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-[#1d2b7d] mr-3" />
                    <span>Show my profile to other members</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <Input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.showProfile}
                      onChange={() =>
                        handleToggleChange("showProfile", setPreferences)
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1d2b7d]"></div>
                  </label>
                </motion.div>
                <motion.div
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
                >
                  <div className="flex items-center">
                    <MessageSquare className="w-5 h-5 text-[#1d2b7d] mr-3" />
                    <span>Allow direct messages</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <Input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.allowMessages}
                      onChange={() =>
                        handleToggleChange("allowMessages", setPreferences)
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1d2b7d]"></div>
                  </label>
                </motion.div>
                <motion.div
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
                >
                  <div className="flex items-center">
                    <Bell className="w-5 h-5 text-[#1d2b7d] mr-3" />
                    <span>Email notifications for new messages</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <Input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.emailNotifications}
                      onChange={() =>
                        handleToggleChange("emailNotifications", setPreferences)
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1d2b7d]"></div>
                  </label>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        );
      case "activity":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <motion.div
              className="bg-white rounded-xl shadow-md p-6"
              whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Activity Center
              </h3>
              <div className="p-8 text-center">
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 bg-[#1d2b7d]/10 rounded-full mb-4"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.3,
                  }}
                >
                  <BookOpen className="w-8 h-8 text-[#1d2b7d]" />
                </motion.div>
                <motion.h4
                  className="text-lg font-medium text-gray-800 mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Activity Tracking Coming Soon
                </motion.h4>
                <motion.p
                  className="text-gray-600 max-w-md mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  We are working on a comprehensive activity tracking system to
                  help you monitor your engagement with our educational
                  community.
                </motion.p>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl shadow-md p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Future Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  className="border border-dashed border-gray-300 rounded-lg p-4 text-center"
                  whileHover={{ scale: 1.03, borderColor: "#1d2b7d" }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1d2b7d]/10 rounded-full mb-3">
                    <MessageSquare className="w-6 h-6 text-[#1d2b7d]" />
                  </div>
                  <h4 className="font-medium text-gray-800 mb-1">
                    Post & Comment History
                  </h4>
                  <p className="text-sm text-gray-500">
                    Track all your contributions
                  </p>
                </motion.div>
                <motion.div
                  className="border border-dashed border-gray-300 rounded-lg p-4 text-center"
                  whileHover={{ scale: 1.03, borderColor: "#1d2b7d" }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1d2b7d]/10 rounded-full mb-3">
                    <Shield className="w-6 h-6 text-[#1d2b7d]" />
                  </div>
                  <h4 className="font-medium text-gray-800 mb-1">
                    Achievement Badges
                  </h4>
                  <p className="text-sm text-gray-500">
                    Earn badges for your participation
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        );
      case "notifications":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <motion.div
              className="bg-white rounded-xl shadow-md p-6"
              whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Notification Settings
              </h3>
              <div className="space-y-4">
                <motion.div
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      Email Notifications
                    </p>
                    <p className="text-sm text-gray-500">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <Input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notificationSettings.emailNotifications}
                      onChange={() =>
                        handleToggleChange(
                          "emailNotifications",
                          setNotificationSettings
                        )
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1d2b7d]"></div>
                  </label>
                </motion.div>
                <motion.div
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      Push Notifications
                    </p>
                    <p className="text-sm text-gray-500">
                      Receive push notifications on your device
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <Input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notificationSettings.pushNotifications}
                      onChange={() =>
                        handleToggleChange(
                          "pushNotifications",
                          setNotificationSettings
                        )
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1d2b7d]"></div>
                  </label>
                </motion.div>
                <motion.div
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      Comment Notifications
                    </p>
                    <p className="text-sm text-gray-500">
                      Get notified when someone comments on your posts
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <Input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notificationSettings.commentNotifications}
                      onChange={() =>
                        handleToggleChange(
                          "commentNotifications",
                          setNotificationSettings
                        )
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1d2b7d]"></div>
                  </label>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl shadow-md p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Recent Notifications
                </h3>
                <div className="text-sm text-gray-500">
                  {unreadCount} unread
                </div>
              </div>
              
              {notificationLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-start p-3">
                        <div className="bg-gray-200 p-2 rounded-full mr-4 w-9 h-9"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                          <div className="h-2 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.slice(0, 5).map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      className={`flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer ${
                        !notification.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}
                      onClick={() => {
                        if (!notification.is_read) {
                          dispatch(markNotificationsAsRead({ notification_ids: [notification.id] }));
                        }
                      }}
                    >
                      <div className="bg-[#1d2b7d]/10 p-2 rounded-full mr-4">
                        <Bell className="w-5 h-5 text-[#1d2b7d]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <p className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-800'}`}>
                            {notification.title || 'Notification'}
                          </p>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {notification.message || 'No message content'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.created_at ? new Date(notification.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {notifications.length > 5 && (
                    <motion.div
                      className="text-center pt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      <button
                        onClick={() => router.push('/user-dashboard/notifications')}
                        className="text-[#1d2b7d] hover:text-[#162058] font-medium text-sm"
                      >
                        View all notifications →
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.div
                  className="text-center py-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium mb-2">No notifications yet</p>
                  <p className="text-gray-400 text-sm">
                    You&apos;ll see notifications here when you have new activity
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        );
      case "security":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <motion.div
              className="bg-white rounded-xl shadow-md p-6"
              whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Password
              </h3>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    name="currentPassword"
                    value={securityData.currentPassword}
                    onChange={handleSecurityChange}
                    className="w-full px-4 py-2 border rounded-lg focus:border-[#1d2b7d] focus:outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    New Password
                  </label>
                  <Input
                    type="password"
                    name="newPassword"
                    value={securityData.newPassword}
                    onChange={handleSecurityChange}
                    className="w-full px-4 py-2 border rounded-lg focus:border-[#1d2b7d] focus:outline-none"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 8 characters long
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={securityData.confirmPassword}
                    onChange={handleSecurityChange}
                    className="w-full px-4 py-2 border rounded-lg focus:border-[#1d2b7d] focus:outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <motion.div
                  className="mt-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.button
                    type="submit"
                    className="bg-[#1d2b7d] hover:bg-[#162058] text-white font-medium py-2 px-6 rounded-lg transition-colors duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Update Password
                  </motion.button>
                </motion.div>
              </form>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl shadow-md p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Two-Factor Authentication
              </h3>
              <p className="text-gray-600 mb-4">
                Add an extra layer of security to your account by enabling
                two-factor authentication.
              </p>
              <div className="flex items-center justify-between">
                <span className="font-medium">Enable 2FA</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <Input
                    type="checkbox"
                    className="sr-only peer"
                    checked={securityData.twoFactorEnabled}
                    onChange={() =>
                      setSecurityData((prev) => ({
                        ...prev,
                        twoFactorEnabled: !prev.twoFactorEnabled,
                      }))
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1d2b7d]"></div>
                </label>
              </div>
              <AnimatePresence>
                {securityData.twoFactorEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <p className="text-sm text-gray-600">
                      Two-factor authentication is enabled. You will receive a
                      verification code via email when signing in.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl shadow-md p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Account Actions
              </h3>
              <div className="space-y-4">
                <motion.button
                  onClick={() =>
                    alert("You've been logged out from all devices.")
                  }
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors border"
                  whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.03)", x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center">
                    <LogOut className="w-5 h-5 text-gray-500 mr-3" />
                    <span>Log out from all devices</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </motion.button>
                <motion.button
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to deactivate your account? This action cannot be undone."
                      )
                    ) {
                      alert("Your account has been deactivated.");
                      router.push("/");
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                  whileHover={{
                    backgroundColor: "rgba(254, 226, 226, 0.5)",
                    x: 5,
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-red-500 mr-3" />
                    <span className="text-red-500">Deactivate account</span>
                  </div>
                  <span className="text-red-400">→</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        );
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-auto">
        {/* Profile Header */}
        <motion.div
          className="bg-white rounded-xl shadow-md overflow-hidden mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
        >
          <div className="h-32 bg-gradient-to-r from-[#1d2b7d] to-[#2a3d99]"></div>
          <div className="px-6 py-4 md:px-8 md:py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center">
              <motion.div
                className="relative -mt-16 mb-4 md:mb-0 md:mr-6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white bg-white">
                  <Image
                    src={avatarError || !currentUser?.avatar ? user : currentUser.avatar}
                    alt={currentUser?.name || "User"}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                    onError={() => setAvatarError(true)}
                  />
                </div>
                <motion.button
                  onClick={() => setIsEditing(true)}
                  className="absolute bottom-0 right-0 bg-[#1d2b7d] text-white p-1 rounded-full"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Edit className="w-4 h-4" />
                </motion.button>
              </motion.div>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h1 className="text-2xl font-bold text-gray-800">
                      {currentUser?.name || "User"}
                    </h1>
                    <p className="text-gray-500">
                      Joined {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "N/A"}
                    </p>
                  </motion.div>
                  <motion.div
                    className="mt-4 md:mt-0 flex space-x-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.button
                      onClick={() => setIsEditing(true)}
                      className="bg-[#1d2b7d] hover:bg-[#162058] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </div>

            <motion.div
              className="mt-6 border-t pt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-black">{currentUser?.bio || "No bio available"}</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Profile Content */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <motion.div
            className="md:w-1/4"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-xl shadow-md overflow-hidden sticky top-8">
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  onClick={() => tab.id && setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 p-4 text-left border-l-4 transition-all ${
                    activeTab === tab.id
                      ? "border-[#1d2b7d] bg-[#1d2b7d]/5 text-[#1d2b7d]"
                      : "border-transparent hover:bg-gray-50 text-gray-700"
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ x: 5 }}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </motion.button>
              ))}
              <motion.button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-4 text-left border-l-4 border-transparent hover:bg-gray-50 text-red-500"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ x: 5 }}
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            className="md:w-3/4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
