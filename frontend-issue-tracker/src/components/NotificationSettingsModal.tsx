import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';

interface NotificationSettings {
  newIssueAssigned: boolean;
  mentions: boolean;
  issueStatusChanged: boolean;
  issueCommented: boolean;
  messengerNotifications: boolean;
  messengerType: 'slack' | 'telegram' | null;
  messengerIntegrated: boolean;
}

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    newIssueAssigned: true,
    mentions: true,
    issueStatusChanged: true,
    issueCommented: true,
    messengerNotifications: false,
    messengerType: null,
    messengerIntegrated: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState({
    isConnected: false,
    telegramUsername: null as string | null
  });
  const [chatId, setChatId] = useState('');
  const [isSavingChatId, setIsSavingChatId] = useState(false);

  const notificationTypes = [
    {
      key: 'newIssueAssigned' as keyof NotificationSettings,
      title: '이슈 할당',
      description: '새로운 이슈가 나에게 할당되었을 때',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      key: 'mentions' as keyof NotificationSettings,
      title: '멘션',
      description: '누군가 나를 멘션(@username)했을 때',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
      ),
    },
    {
      key: 'issueStatusChanged' as keyof NotificationSettings,
      title: '이슈 상태 변경',
      description: '내가 담당자인 이슈의 상태가 변경되었을 때',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      key: 'issueCommented' as keyof NotificationSettings,
      title: '이슈 댓글',
      description: '내가 관련된 이슈에 새로운 댓글이 달렸을 때',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
      fetchTelegramStatus();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notification-settings', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('알림 설정을 불러오는데 실패했습니다:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTelegramStatus = async () => {
    try {
      const response = await fetch('/api/telegram/status', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTelegramStatus(data);
        if (data.isConnected) {
          setSettings(prev => ({
            ...prev,
            messengerType: 'telegram',
            messengerIntegrated: true,
          }));
        }
      }
    } catch (error) {
      console.error('텔레그램 상태 확인 실패:', error);
    }
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleTelegramSave = async () => {
    if (!chatId.trim()) {
      alert('Chat ID를 입력해주세요.');
      return;
    }
    setIsSavingChatId(true);
    try {
      const response = await fetch('/api/telegram/save-chat-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ chatId }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setTelegramStatus({ isConnected: true, telegramUsername: data.telegramUsername });
        setSettings(prev => ({ ...prev, messengerIntegrated: true }));
      } else {
        throw new Error(data.message || '연동에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('텔레그램 연동 실패:', error);
      alert(`텔레그램 연동 실패: ${error.message}`);
    } finally {
      setIsSavingChatId(false);
    }
  };

  const handleTelegramDisconnect = async () => {
    if (!confirm('텔레그램 연동을 해제하시겠습니까?')) {
      return;
    }
    try {
      const response = await fetch('/api/telegram/disconnect', {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        setTelegramStatus({ isConnected: false, telegramUsername: null });
        setSettings(prev => ({ ...prev, messengerType: null, messengerIntegrated: false }));
        setChatId('');
        alert('텔레그램 연동이 해제되었습니다.');
      } else {
        throw new Error('연동 해제에 실패했습니다.');
      }
    } catch (error) {
      console.error('텔레그램 연동 해제 실패:', error);
      alert('텔레그램 연동 해제에 실패했습니다.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      if (response.ok) {
        onClose();
      } else {
        throw new Error('설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black bg-opacity-25" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5V17z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.05 4.575a6 6 0 0 1 9.375 5.043 6 6 0 0 1-9.375 5.043V4.575z" />
                </svg>
                알림 설정
              </div>
            </Dialog.Title>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-6">받고 싶은 알림 유형을 선택하세요.</p>
                
                {notificationTypes.map((type) => (
                  <div key={type.key} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="text-blue-500 mt-0.5">{type.icon}</div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{type.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        type="button"
                        className={`${settings[type.key] ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        onClick={() => handleToggle(type.key)}
                      >
                        <span className={`${settings[type.key] ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">메신저 알림</h4>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="text-blue-500 mt-0.5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">메신저로 알림 받기</h4>
                        <p className="text-xs text-gray-500 mt-1">외부 메신저 앱으로 알림을 받습니다</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        type="button"
                        className={`${settings.messengerNotifications ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        onClick={() => handleToggle('messengerNotifications')}
                      >
                        <span className={`${settings.messengerNotifications ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                      </button>
                    </div>
                  </div>

                  {settings.messengerNotifications && (
                    <div className="mt-4 ml-8 space-y-3">
                      <p className="text-sm text-gray-600 mb-3">알림을 받을 메신저를 선택하세요:</p>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="telegram"
                            name="messengerType"
                            value="telegram"
                            checked={settings.messengerType === 'telegram'}
                            onChange={(e) => setSettings(prev => ({ ...prev, messengerType: e.target.value as 'telegram' }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor="telegram" className="text-sm font-medium text-gray-900">
                            Telegram
                            {telegramStatus.isConnected && telegramStatus.telegramUsername && (
                              <span className="ml-2 text-xs text-green-600">({telegramStatus.telegramUsername})</span>
                            )}
                          </label>
                        </div>
                      </div>

                      {settings.messengerType === 'telegram' && (
                        <div className="p-4 border-l-4 border-blue-400 bg-blue-50">
                          {telegramStatus.isConnected ? (
                            <div className='text-center'>
                              <p className='text-sm text-green-700'>텔레그램이 성공적으로 연동되었습니다.</p>
                              <button
                                type="button"
                                className="mt-2 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-600 rounded-md hover:bg-red-50"
                                onClick={handleTelegramDisconnect}
                              >
                                연동해제
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-sm text-gray-700">
                                1. 텔레그램에서 <a href="https://t.me/issuetracker_alert_bot" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@issuetracker_alert_bot</a>을 검색하여 대화를 시작하세요. (아무 메시지나 보내기)
                              </p>
                              <p className="text-sm text-gray-700">
                                2. 텔레그램에서 <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@userinfobot</a>을 검색하여 대화를 시작하세요.
                              </p>
                              <p className="text-sm text-gray-700">
                                3. 봇이 알려주는 숫자 'Id'를 아래에 입력하세요.
                              </p>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={chatId}
                                  onChange={(e) => setChatId(e.target.value)}
                                  placeholder="Chat ID 입력"
                                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button
                                  type="button"
                                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                                  onClick={handleTelegramSave}
                                  disabled={isSavingChatId}
                                >
                                  {isSavingChatId ? '확인 중...' : '저장'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                onClick={onClose}
              >
                취소
              </button>
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSave}
                disabled={saving || loading}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default NotificationSettingsModal;