import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "../components/icons/ArrowLeftIcon";
import { KeyIcon } from "../components/icons/KeyIcon";
import { CameraIcon } from "../components/icons/CameraIcon";

interface User {
  id: string;
  userid: string;
  username: string;
  profileImage?: string;
}

export const UserSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [profileDetails, setProfileDetails] = useState({
    department: "",
    position: "",
    
    workPhone: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("/api/current-user");
        if (res.ok) {
          const data = await res.json();
          const userRes = await fetch(`/api/users/${data.userid}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            setCurrentUser(userData);
            if (userData.profileImage) {
              setPreviewImage(userData.profileImage);
            }
            setProfileDetails({
              department: userData.department || "",
              position: userData.position || "",
              manager: userData.manager || "",
              employeeId: userData.employeeId || "",
              workPhone: userData.workPhone || "",
              email: userData.email || "",
              role: userData.role || "",
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!currentUser) return;

    try {
      const res = await fetch(`/api/users/${currentUser.userid}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("비밀번호가 변경되었습니다.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        alert(`비밀번호 변경 실패: ${data.message}`);
      }
    } catch (error) {
      console.error("Password change error:", error);
      alert("비밀번호 변경 중 오류가 발생했습니다.");
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileImageFile || !currentUser) return;

    const formData = new FormData();
    formData.append("profileImage", profileImageFile);

    try {
      const res = await fetch(
        `/api/users/${currentUser.userid}/profile-image`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      if (res.ok) {
        alert("프로필 이미지가 업로드되었습니다.");
        setCurrentUser({ ...currentUser, profileImage: data.profileImage });
      } else {
        alert(`업로드 실패: ${data.message}`);
      }
    } catch (error) {
      console.error("Profile image upload error:", error);
      alert("프로필 이미지 업로드 중 오류가 발생했습니다.");
    }
  };

  const handleProfileDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setProfileDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const res = await fetch(`/api/users/${currentUser.userid}/details`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileDetails),
      });
      const data = await res.json();
      if (res.ok) {
        alert("프로필 정보가 업데이트되었습니다.");
        setCurrentUser((prev) =>
          prev ? { ...prev, ...profileDetails } : null
        );
      } else {
        alert(`프로필 정보 업데이트 실패: ${data.message}`);
      }
    } catch (error) {
      console.error("Profile details update error:", error);
      alert("프로필 정보 업데이트 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("/api/current-user");
        if (res.ok) {
          const data = await res.json();
          const userRes = await fetch(`/api/users/${data.userid}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            setCurrentUser(userData);
            if (userData.profileImage) {
              setPreviewImage(userData.profileImage);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            뒤로 가기
          </button>
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-8">사용자 설정</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-slate-700">
                프로필
              </h2>
              <form onSubmit={handleProfileImageUpload} className="space-y-6">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <span className="inline-block h-32 w-32 rounded-full overflow-hidden bg-slate-100 shadow-inner">
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="Profile Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <svg
                          className="h-full w-full text-slate-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M24 20.993V24H0v-2.997A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      )}
                    </span>
                    <label
                      htmlFor="profile-image-upload"
                      className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors"
                    >
                      <CameraIcon className="w-5 h-5" />
                      <input
                        id="profile-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-slate-800">
                    {currentUser?.username}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {currentUser?.userid}
                  </p>
                </div>

                {profileImageFile && (
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    프로필 사진 저장
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Password Change Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-slate-700">
                <KeyIcon className="w-5 h-5 mr-2 text-slate-400" />
                비밀번호 변경
              </h2>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    현재 비밀번호
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    새 비밀번호
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    새 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    비밀번호 변경
                  </button>
                </div>
              </form>
            </div>

            {/* Profile Details Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-slate-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 mr-2 text-slate-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6.75a.75.75 0 11-.75-.75.75.75 0 01.75.75zM4.501 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm15 .75a.75.75 0 11-.75-.75.75.75 0 01.75.75zM12 9a.75.75 0 11-.75-.75.75.75 0 01.75.75zm5.25-.75a.75.75 0 11-.75-.75.75.75 0 01.75.75zm-1.5 2.25a.75.75 0 11-.75-.75.75.75 0 01.75.75zM12 15a.75.75 0 11-.75-.75.75.75 0 01.75.75zm3.75-2.25a.75.75 0 11-.75-.75.75.75 0 01.75.75zm-1.5 2.25a.75.75 0 11-.75-.75.75.75 0 01.75.75zM12 18a.75.75 0 11-.75-.75.75.75 0 01.75.75zM15.75 15a.75.75 0 11-.75-.75.75.75 0 01.75.75zM18.75 12a.75.75 0 11-.75-.75.75.75 0 01.75.75zM8.25 6.75a.75.75 0 11-.75-.75.75.75 0 01.75.75zM4.5 15.75a.75.75 0 11-.75-.75.75.75 0 01.75.75zM12 6a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v1.5M12 18v1.5M15.75 12H17.25M6.75 12H8.25M12 6.75a5.25 5.25 0 00-5.25 5.25v1.5M12 17.25a5.25 5.25 0 005.25-5.25v-1.5"
                  />
                </svg>
                프로필 정보
              </h2>
              <form onSubmit={handleProfileDetailsSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    이메일
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileDetails.email}
                    onChange={handleProfileDetailsChange}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    부서
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={profileDetails.department}
                    onChange={handleProfileDetailsChange}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    직급
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={profileDetails.position}
                    onChange={handleProfileDetailsChange}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    역할
                  </label>
                  <input
                    type="text"
                    name="role"
                    value={profileDetails.role}
                    onChange={handleProfileDetailsChange}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    업무 연락처
                  </label>
                  <input
                    type="text"
                    name="workPhone"
                    value={profileDetails.workPhone}
                    onChange={handleProfileDetailsChange}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm sm:text-sm"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    정보 업데이트
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
