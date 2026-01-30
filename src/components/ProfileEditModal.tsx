import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { updateProfile } from '@/lib/profiles';
import { uploadProfileImage, deleteProfileImage } from '@/lib/storage';
import type { Profile } from '@/types/database.types';
import { Upload, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  userId: string;
  onSuccess?: () => void;
}

const ACCEPTED_IMAGE = 'image/jpeg,image/png,image/webp,image/gif';
const MAX_SIZE_MB = 3;

export default function ProfileEditModal({
  open,
  onOpenChange,
  profile,
  userId,
  onSuccess,
}: ProfileEditModalProps) {
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [emailPublic, setEmailPublic] = useState(profile?.email_public ?? true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setNickname(profile?.nickname ?? '');
    setBio(profile?.bio ?? '');
    setEmailPublic(profile?.email_public ?? true);
    setAvatarFile(null);
    setAvatarPreview(null);
  }, [profile]);

  useEffect(() => {
    if (open && profile) {
      setNickname(profile.nickname ?? '');
      setBio(profile.bio ?? '');
      setEmailPublic(profile.email_public ?? true);
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  }, [open, profile]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) resetForm();
      onOpenChange(next);
    },
    [onOpenChange, resetForm]
  );

  const displayPhotoUrl = avatarPreview ?? profile?.avatar_url ?? null;

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`파일 크기는 ${MAX_SIZE_MB}MB 이하여야 합니다.`);
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileSelect(file ?? null);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files?.[0] ?? null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }
    if (!userId) return;

    setSaving(true);
    try {
      let avatarUrl: string | undefined = profile?.avatar_url;

      if (avatarFile) {
        const newUrl = await uploadProfileImage(avatarFile, userId);
        avatarUrl = newUrl;
        if (profile?.avatar_url && profile.avatar_url !== newUrl) {
          try {
            await deleteProfileImage(profile.avatar_url);
          } catch {
            // ignore old image delete failure
          }
        }
      }

      await updateProfile(userId, {
        nickname: nickname.trim(),
        bio: bio.trim() || undefined,
        email_public: emailPublic,
        ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
      });

      handleOpenChange(false);
      alert('프로필이 수정되었습니다.');
      window.location.reload();
      onSuccess?.();
    } catch (err) {
      console.error('프로필 수정 실패:', err);
      alert(err instanceof Error ? err.message : '프로필 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>프로필 수정</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* 프로필 사진 */}
          <div className="space-y-2">
            <Label>프로필 사진</Label>
            <div className="flex flex-col items-center gap-3">
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  'w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-2 border-dashed bg-muted/50 cursor-pointer transition-colors',
                  dragActive && 'border-primary bg-primary/10'
                )}
              >
                {displayPhotoUrl ? (
                  <img
                    src={displayPhotoUrl}
                    alt="프로필"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE}
                onChange={handleInputChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                사진 변경
              </Button>
              <p className="text-xs text-muted-foreground">
                드래그하거나 클릭해서 올리기 (JPEG, PNG, WebP, GIF, {MAX_SIZE_MB}MB 이하)
              </p>
            </div>
          </div>

          {/* 닉네임 */}
          <div className="space-y-2">
            <Label htmlFor="edit-nickname">닉네임 *</Label>
            <input
              id="edit-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="닉네임을 입력하세요"
            />
          </div>

          {/* 한줄소개 */}
          <div className="space-y-2">
            <Label htmlFor="edit-bio">한줄소개</Label>
            <input
              id="edit-bio"
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="자기소개를 입력하세요"
            />
          </div>

          {/* 이메일 공개 여부 */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="edit-email-public">이메일 공개</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                다른 사용자에게 이메일을 보여줍니다
              </p>
            </div>
            <Switch
              id="edit-email-public"
              checked={emailPublic}
              onCheckedChange={setEmailPublic}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
