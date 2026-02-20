'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormBuilder } from '@/components/FormBuilder';
import { FormRenderer } from '@/components/FormRenderer';
import { VersionHistory } from '@/components/VersionHistory';
import { DuplicateFormDialog } from '@/components/DuplicateFormDialog';
import { QRCodeTab } from '@/components/form-tabs/QRCodeTab';
import { DraftAlert, FormHeaderV4, FormTabs, ActionBar, ConfirmDialog, SuccessModal, ApplyThemeModal, type TabType } from '@/components/form-editor';
import { getSupabaseBrowser } from '@/lib/supabase';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useFormVersions } from '@/hooks/useFormVersions';
import { Form, FormField } from '@/types';
import { Eye, X, Shield, CheckCircle, AlertCircle, Rocket, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EditFormPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [showPreview, setShowPreview] = useState(false);
  const [previewSnapshot, setPreviewSnapshot] = useState<Form | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Old Draft system (for compatibility)
  const { draft: oldDraft, saveDraft: saveOldDraft, discard: discardOldDraft } = useFormDraft(formId);

  // New Version/Draft system
  const {
    versions,
    currentVersion,
    draftVersion,
    hasDraft: hasNewDraft,
    isLoading: isLoadingVersions,
    createDraft,
    updateDraft,
    publishDraft,
    deleteDraft,
    refresh: refreshVersions
  } = useFormVersions(formId);

  // Draft editing state
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [draftVersionId, setDraftVersionId] = useState<string | null>(null);

  // Sync draftVersionId from hook's draftVersion (important after refresh)
  useEffect(() => {
    if (draftVersion && draftVersion.id) {
      if (draftVersionId !== draftVersion.id) {
        console.log('[EditFormPage] Syncing draftVersionId from hook:', draftVersion.id);
        setDraftVersionId(draftVersion.id);
        setIsEditingDraft(true);
      }
    }
  }, [draftVersion]);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPosition, setLogoPosition] = useState<'left' | 'center' | 'right'>('center');
  const [logoSize, setLogoSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [theme, setTheme] = useState<'default' | 'card-groups' | 'step-wizard' | 'minimal'>('default');
  const [bannerColor, setBannerColor] = useState<'blue' | 'black' | 'white' | 'custom'>('blue');
  const [bannerCustomColor, setBannerCustomColor] = useState('#2563EB');
  const [bannerMode, setBannerMode] = useState<'gradient' | 'solid'>('gradient');
  const [accentColor, setAccentColor] = useState<'blue' | 'sky' | 'teal' | 'emerald' | 'violet' | 'rose' | 'orange' | 'slate' | 'black' | 'custom'>('blue');
  const [accentCustomColor, setAccentCustomColor] = useState('#2563EB');
  const [requireConsent, setRequireConsent] = useState(false);
  const [consentHeading, setConsentHeading] = useState('การยินยอม (Consent)');
  const [consentText, setConsentText] = useState('');
  const [consentRequireLocation, setConsentRequireLocation] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // CSS Integration Settings (Global config from Settings menu)
  const [cssIntegrationEnabled, setCssIntegrationEnabled] = useState(false);

  const [cssFieldMapping, setCssFieldMapping] = useState({
    jobDetail: '',
    customerName: '',
    telephone: '',
    email: ''
  });

  // Change summary for publish
  const [changeSummary, setChangeSummary] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });

  const [originalFields, setOriginalFields] = useState<FormField[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Apply Theme Modal
  const [showApplyThemeModal, setShowApplyThemeModal] = useState(false);
  const [isApplyingTheme, setIsApplyingTheme] = useState(false);
  const [applyThemeSuccess, setApplyThemeSuccess] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Load form data
  useEffect(() => {
    async function loadForm() {
      try {
        const supabase = getSupabaseBrowser();
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .single();

        if (error || !data) {
          router.push('/admin/forms');
          return;
        }

        const formData = data as Form;
        setForm(formData);

        // If has existing draft version, automatically load it
        if (draftVersion) {
          setIsEditingDraft(true);
          setDraftVersionId(draftVersion.id);
          setTitle(draftVersion.title);
          setSlug(formData.slug);
          setDescription(draftVersion.description || '');
          setFields(draftVersion.fields);
          setOriginalFields(JSON.parse(JSON.stringify(draftVersion.fields)));
          setLogoUrl(draftVersion.logo_url || '');
          setLogoPosition(draftVersion.logo_position || 'center');
          setLogoSize(draftVersion.logo_size || 'medium');
          setTheme(draftVersion.theme || 'default');
          setBannerColor(draftVersion.banner_color || 'blue');
          setBannerCustomColor(draftVersion.banner_custom_color || '#2563EB');
          setBannerMode(draftVersion.banner_mode || 'gradient');
          setAccentColor(draftVersion.accent_color || 'blue');
          setAccentCustomColor(draftVersion.accent_custom_color || '#2563EB');
          setRequireConsent(draftVersion.require_consent);
          setConsentHeading(draftVersion.consent_heading);
          setConsentText(draftVersion.consent_text || '');
          setConsentRequireLocation(draftVersion.consent_require_location);
          setIsActive(formData.is_active ?? true);
          // CSS Integration from published form (draft inherits)
          // CSS Config (contactChannelId, userCreated) now in global Settings
          setCssIntegrationEnabled(formData.css_integration_enabled || false);
          setCssFieldMapping({
            jobDetail: formData.css_field_mapping?.jobDetail || '',
            customerName: formData.css_field_mapping?.customerName || '',
            telephone: formData.css_field_mapping?.telephone || '',
            email: formData.css_field_mapping?.email || ''
          });
          setCssFieldMapping({
            jobDetail: formData.css_field_mapping?.jobDetail || '',
            customerName: formData.css_field_mapping?.customerName || '',
            telephone: formData.css_field_mapping?.telephone || '',
            email: formData.css_field_mapping?.email || ''
          });
        } else {
          // Use published form data
          setTitle(formData.title);
          setSlug(formData.slug);
          setDescription(formData.description || '');
          setFields(formData.fields);
          setOriginalFields(JSON.parse(JSON.stringify(formData.fields)));
          setLogoUrl(formData.logo_url || '');
          setLogoPosition(formData.logo_position || 'center');
          setLogoSize(formData.logo_size || 'medium');
          setTheme(formData.theme || 'default');
          setBannerColor(formData.banner_color || 'blue');
          setBannerCustomColor(formData.banner_custom_color || '#2563EB');
          setBannerMode(formData.banner_mode || 'gradient');
          setAccentColor(formData.accent_color || 'blue');
          setAccentCustomColor(formData.accent_custom_color || '#2563EB');
          setRequireConsent(formData.require_consent || false);
          setConsentHeading(formData.consent_heading || 'การยินยอม (Consent)');
          setConsentText(formData.consent_text || '');
          setConsentRequireLocation(formData.consent_require_location || false);
          setIsActive(formData.is_active ?? true);
          // CSS Integration Settings
          // CSS Config (contactChannelId, userCreated) now in global Settings
          setCssIntegrationEnabled(formData.css_integration_enabled || false);
          setCssFieldMapping({
            jobDetail: formData.css_field_mapping?.jobDetail || '',
            customerName: formData.css_field_mapping?.customerName || '',
            telephone: formData.css_field_mapping?.telephone || '',
            email: formData.css_field_mapping?.email || ''
          });
        }
      } catch (err) {
        console.error('Error loading form:', err);
        router.push('/admin/forms');
      } finally {
        setLoading(false);
      }
    }

    if (formId) {
      loadForm();
    }
  }, [formId, draftVersion]);

  // Auto-save draft every 30 seconds (pause when preview is open)
  useEffect(() => {
    if (!form || form.status !== 'published' || !isEditingDraft || showPreview) return;

    const interval = setInterval(() => {
      handleAutoSave();
    }, 30000);

    return () => clearInterval(interval);
  }, [form, title, description, fields, logoUrl, logoPosition, logoSize, theme, bannerColor, bannerCustomColor, bannerMode, accentColor, accentCustomColor, requireConsent, consentHeading, consentText, consentRequireLocation, showPreview, draftVersionId]);

  const handleAutoSave = async () => {
    if (!form || form.status !== 'published' || !isEditingDraft || !draftVersionId) return;

    try {
      await updateDraft(draftVersionId, {
        title,
        description,
        logo_url: logoUrl,
        theme,
        banner_color: bannerColor,
        banner_custom_color: bannerCustomColor,
        banner_mode: bannerMode,
        accent_color: accentColor,
        accent_custom_color: accentCustomColor,
        logo_position: logoPosition,
        logo_size: logoSize,
        fields,
        require_consent: requireConsent,
        consent_heading: consentHeading,
        consent_text: consentText,
        consent_require_location: consentRequireLocation,
        css_integration_enabled: cssIntegrationEnabled,
        css_field_mapping: cssFieldMapping,
      });
      console.log('Draft auto-saved');
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  };

  // Save changes to draft version (create new if not exists)
  const handleSaveDraft = async () => {
    console.log('[handleSaveDraft] Called, draftVersionId:', draftVersionId, 'draftVersion:', draftVersion?.id);
    setIsSaving(true);
    try {
      // Check if we have an existing draft (either from state or from hook)
      const existingDraftId = draftVersionId || draftVersion?.id;
      
      if (existingDraftId) {
        console.log('[handleSaveDraft] Updating existing draft:', existingDraftId);
        // Update existing draft
        await updateDraft(existingDraftId, {
          title,
          description,
          logo_url: logoUrl,
          theme,
          banner_color: bannerColor,
          banner_custom_color: bannerCustomColor,
          banner_mode: bannerMode,
          accent_color: accentColor,
          accent_custom_color: accentCustomColor,
          logo_position: logoPosition,
          logo_size: logoSize,
          fields,
          require_consent: requireConsent,
          consent_heading: consentHeading,
          consent_text: consentText,
          consent_require_location: consentRequireLocation,
          css_integration_enabled: cssIntegrationEnabled,
          css_field_mapping: cssFieldMapping,
        });
        // Set state if not already set
        if (!draftVersionId) {
          setDraftVersionId(existingDraftId);
          setIsEditingDraft(true);
        }
      } else {
        console.log('[handleSaveDraft] Creating new draft');
        // Create new draft
        const newDraft = await createDraft({
          title,
          description,
          logo_url: logoUrl,
          theme,
          banner_color: bannerColor,
          banner_custom_color: bannerCustomColor,
          banner_mode: bannerMode,
          accent_color: accentColor,
          accent_custom_color: accentCustomColor,
          logo_position: logoPosition,
          logo_size: logoSize,
          fields,
          require_consent: requireConsent,
          consent_heading: consentHeading,
          consent_text: consentText,
          consent_require_location: consentRequireLocation,
        });
        setDraftVersionId(newDraft.id);
        setIsEditingDraft(true);
        console.log('[handleSaveDraft] New draft created:', newDraft.id);
      }
      console.log('[handleSaveDraft] Success');
      console.log('[handleSaveDraft] Before state update - draftVersionId:', draftVersionId, 'isEditingDraft:', isEditingDraft);
      
      // Show immediate toast notification
      showToast('success', draftVersionId ? 'อัพเดต Draft สำเร็จ' : 'สร้าง Draft ใหม่สำเร็จ');
      
      // Set editing draft state
      setIsEditingDraft(true);
      console.log('[handleSaveDraft] After setIsEditingDraft(true)');
      
      // Refresh to update data
      await refreshVersions();
      console.log('[handleSaveDraft] After refreshVersions');
      
      // Set flag to refresh forms list when navigating back
      sessionStorage.setItem('refreshFormsList', 'true');
      console.log('[handleSaveDraft] Set sessionStorage flag');
      
      setSuccessMessage({
        title: 'บันทึก Draft สำเร็จ',
        message: draftVersionId 
          ? 'Draft ของคุณได้รับการอัพเดตเรียบร้อยแล้ว' 
          : 'สร้าง Draft ใหม่สำเร่จ คุณสามารถแก้ไขต่อและ Publish ได้ภายหลัง'
      });
      setShowSuccessModal(true);
    } catch (err) {
      console.error('[handleSaveDraft] Error:', err);
      showToast('error', 'เกิดข้อผิดพลาดในการบันทึก: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Create new draft version from current form
  const handleCreateDraft = async () => {
    setIsSaving(true);
    try {
      const newDraft = await createDraft({
        title,
        description,
        logo_url: logoUrl,
        theme,
        banner_color: bannerColor,
        banner_custom_color: bannerCustomColor,
        banner_mode: bannerMode,
        accent_color: accentColor,
        accent_custom_color: accentCustomColor,
        logo_position: logoPosition,
        logo_size: logoSize,
        fields,
        require_consent: requireConsent,
        consent_heading: consentHeading,
        consent_text: consentText,
        consent_require_location: consentRequireLocation,
        css_integration_enabled: cssIntegrationEnabled,
        css_field_mapping: cssFieldMapping,
      });
      setIsEditingDraft(true);
      setDraftVersionId(newDraft.id);
      showToast('success', 'สร้าง Draft ใหม่สำเร็จ');
    } catch (err) {
      console.error('Create draft error:', err);
      showToast('error', 'เกิดข้อผิดพลาดในการสร้าง Draft: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Publish draft version
  const handlePublishDraft = async () => {
    if (!draftVersionId) {
      showToast('error', 'ไม่พบ Draft ที่จะ Publish');
      return;
    }

    setIsSaving(true);
    try {
      await publishDraft(draftVersionId, changeSummary);
      setIsEditingDraft(false);
      setDraftVersionId(null);
      setShowPublishModal(false);
      setChangeSummary('');
      showToast('success', 'Publish Draft สำเร็จ');

      // Navigate back to forms list to refresh (forms list will refresh via sessionStorage flag)
      setTimeout(() => {
        router.push('/admin/forms');
      }, 500);
    } catch (err) {
      console.error('Publish error:', err);
      showToast('error', 'เกิดข้อผิดพลาดในการ Publish: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete draft version
  const handleDeleteDraft = () => {
    if (!draftVersionId) {
      showToast('error', 'ไม่พบ Draft ที่จะลบ');
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDraft = async () => {
    if (!draftVersionId) return;

    setIsSaving(true);
    try {
      await deleteDraft(draftVersionId);
      setIsEditingDraft(false);
      setDraftVersionId(null);
      setShowDeleteConfirm(false);
      showToast('success', 'ลบ Draft สำเร็จ');
      // Reload with published data
      router.push(`/admin/forms/${formId}`);
    } catch (err) {
      console.error('Delete draft error:', err);
      showToast('error', 'เกิดข้อผิดพลาดในการลบ Draft: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle form active status
  const handleToggleActive = async (newActiveState: boolean) => {
    setIsSaving(true);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase
        .from('forms')
        .update({ is_active: newActiveState })
        .eq('id', formId);

      if (error) throw error;

      setIsActive(newActiveState);
      setShowDeactivateConfirm(false);
      showToast(
        'success',
        newActiveState ? 'เปิดใช้งานแบบสอบถามสำเร็จ' : 'ปิดใช้งานแบบสอบถามชั่วคราวสำเร็จ'
      );
    } catch (err) {
      console.error('Toggle active error:', err);
      showToast('error', 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Save published form directly (for non-published forms)
  const handleSavePublished = async () => {
    console.log('[handleSavePublished] Called');
    setIsSaving(true);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase
        .from('forms')
        .update({
          title,
          slug,
          description,
          fields,
          logo_url: logoUrl,
          require_consent: requireConsent,
          consent_heading: consentHeading,
          consent_text: consentText,
          consent_require_location: consentRequireLocation,
          css_integration_enabled: cssIntegrationEnabled,
          css_field_mapping: cssFieldMapping,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formId);

      if (error) throw error;
      console.log('[handleSavePublished] Success');
      showToast('success', 'บันทึกสำเร็จ');
    } catch (err) {
      console.error('[handleSavePublished] Error:', err);
      showToast('error', 'เกิดข้อผิดพลาดในการบันทึก: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardDraft = () => {
    setShowDiscardConfirm(true);
  };

  const confirmDiscardDraft = async () => {
    try {
      await discardOldDraft();
      setShowDiscardConfirm(false);
      router.refresh();
      window.location.href = `/admin/forms/${formId}`;
    } catch (err) {
      showToast('error', 'เกิดข้อผิดพลาด');
    }
  };

  const handlePublish = async () => {
    if (!title || !slug) {
      showToast('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsSaving(true);
    try {
      const supabase = getSupabaseBrowser();
      const currentVersion = form?.current_version || 0;
      const newVersion = currentVersion + 1;

      const { error: updateError } = await supabase
        .from('forms')
        .update({
          title,
          slug,
          description,
          fields,
          logo_url: logoUrl,
          logo_position: logoPosition,
          logo_size: logoSize,
          theme,
          require_consent: requireConsent,
          consent_heading: consentHeading,
          consent_text: consentText,
          consent_require_location: consentRequireLocation,
          css_integration_enabled: cssIntegrationEnabled,
          css_field_mapping: cssFieldMapping,
          is_active: true,
          status: 'published',
          current_version: newVersion,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formId);

      if (updateError) throw updateError;

      const { error: versionError } = await supabase
        .from('form_versions')
        .insert({
          form_id: formId,
          version: newVersion,
          fields: fields,
          title,
          description,
          logo_url: logoUrl,
          theme,
          require_consent: requireConsent,
          consent_heading: consentHeading,
          consent_text: consentText,
          consent_require_location: consentRequireLocation,
          css_integration_enabled: cssIntegrationEnabled,
          css_field_mapping: cssFieldMapping,
          change_summary: `Updated to version ${newVersion}`,
          published_at: new Date().toISOString(),
        });

      if (versionError) throw versionError;

      // Clean up old draft if exists
      if (oldDraft) {
        await discardOldDraft();
      }

      showToast('success', `Publish สำเร็จ (Version ${newVersion})`);

      setTimeout(() => {
        window.location.href = '/admin/forms';
      }, 800);
    } catch (err: any) {
      console.error('Publish error:', err);
      showToast('error', err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsSaving(false);
    }
  };

  const hasFieldsChanged = (): boolean => {
    if (!originalFields || originalFields.length === 0) return true;
    if (fields.length !== originalFields.length) return true;
    return JSON.stringify(fields) !== JSON.stringify(originalFields);
  };

  const isValid = title && slug && fields.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!form) return null;

  // Create snapshot when opening preview
  const handleOpenPreview = () => {
    const snapshot = {
      ...form,
      title,
      description,
      logo_url: logoUrl,
      logo_position: logoPosition,
      logo_size: logoSize,
      theme,
      banner_color: bannerColor,
      banner_custom_color: bannerCustomColor,
      banner_mode: bannerMode,
      accent_color: accentColor,
      accent_custom_color: accentCustomColor,
      fields,
      require_consent: requireConsent,
      consent_heading: consentHeading,
      consent_text: consentText,
      consent_require_location: consentRequireLocation,
      css_integration_enabled: cssIntegrationEnabled,
      css_field_mapping: cssFieldMapping,
    };
    console.log('Preview snapshot:', {
      banner_color: snapshot.banner_color,
      banner_custom_color: snapshot.banner_custom_color,
      banner_mode: snapshot.banner_mode
    });
    setPreviewSnapshot(snapshot);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    // Clear snapshot after animation
    setTimeout(() => setPreviewSnapshot(null), 300);
  };

  // Apply Theme - Update theme without creating new version
  const handleApplyTheme = async () => {
    setIsApplyingTheme(true);
    try {
      const response = await fetch(`/api/forms/${formId}/theme`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          banner_color: bannerColor,
          banner_custom_color: bannerCustomColor,
          banner_mode: bannerMode,
          accent_color: accentColor,
          accent_custom_color: accentCustomColor,
          logo_url: logoUrl,
          logo_position: logoPosition,
          logo_size: logoSize,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to apply theme');
      }

      // Show success state in modal
      setApplyThemeSuccess(true);
      
      // Refresh to get updated data
      router.refresh();
    } catch (err: any) {
      console.error('Apply theme error:', err);
      showToast('error', err.message || 'เกิดข้อผิดพลาดในการ Apply Theme');
    } finally {
      setIsApplyingTheme(false);
    }
  };

  // Use snapshot if available, otherwise use current state
  const previewForm = previewSnapshot || {
    ...form,
    title,
    description,
    logo_url: logoUrl,
    logo_position: logoPosition,
    logo_size: logoSize,
    theme,
    banner_color: bannerColor,
    banner_custom_color: bannerCustomColor,
    banner_mode: bannerMode,
    accent_color: accentColor,
    accent_custom_color: accentCustomColor,
    fields,
    require_consent: requireConsent,
    consent_heading: consentHeading,
    consent_text: consentText,
    consent_require_location: consentRequireLocation,
    css_integration_enabled: cssIntegrationEnabled,
    css_field_mapping: cssFieldMapping,
  };

  // DEBUG: Log render state
  console.log('[EditFormPage] Render - isEditingDraft:', isEditingDraft, 'currentVersion:', currentVersion?.version, 'draftVersionId:', draftVersionId);
  
  return (
    <div className="space-y-6">
      {/* Draft Alert - V4 */}
      {console.log('[EditFormPage] DraftAlert condition:', { isEditingDraft, hasCurrentVersion: !!currentVersion, currentVersionNumber: form?.current_version })}
      {isEditingDraft && (
        <DraftAlert currentVersion={form?.current_version ?? null} />
      )}

      {/* Main Card */}
      <div className={`bg-white shadow-sm border border-slate-200 ${isEditingDraft ? 'rounded-b-xl border-t-0' : 'rounded-xl'}`}>
        {/* Header - V4 */}
        <FormHeaderV4
          formCode={form.code}
          formTitle={form.title}
          onCopy={() => setShowDuplicateDialog(true)}
          onDeleteDraft={isEditingDraft ? handleDeleteDraft : undefined}
          hasDraft={isEditingDraft}
        />

        {/* Tabs + ActionBar - V4 */}
        <div className="px-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 -mb-px">
            <FormTabs activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="sm:ml-auto py-2 sm:py-0">
              <ActionBar
                onPreview={handleOpenPreview}
                onSaveDraft={handleSaveDraft}
                onPublish={() => setShowPublishModal(true)}
                isSaving={isSaving}
                nextVersion={draftVersion?.version ?? ((form.current_version ?? 0) + 1)}
              />
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px] px-4 sm:px-6 py-6">
          {activeTab === 'content' && (
            <div className="w-full space-y-6">
              {/* Basic Info */}
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-300">
                <h2 className="text-lg font-semibold mb-4">ข้อมูลพื้นฐาน</h2>
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">ชื่อแบบสอบถาม</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">URL (Slug)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm whitespace-nowrap">/form/</span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Logo - แยกบรรทัดให้เห็นชัด */}
                  <div className="border-t border-slate-200 pt-4 mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      🖼️ โลโก้ (Logo URL)
                    </label>
                    <div className="flex gap-4 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://example.com/logo.png หรือ /logo.png"
                          className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl"
                        />
                        <p className="text-xs text-slate-500 mt-1.5">
                          แนะนำ: ใช้รูป PNG หรือ SVG มีพื้นหลังโปร่งใส ความสูงประมาณ 80-120px
                        </p>
                      </div>
                      {logoUrl && (
                        <div className="w-24 h-24 bg-slate-50 rounded-xl border-2 border-slate-200 flex items-center justify-center p-2">
                          <img src={logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                    </div>

                    {/* Logo Position & Size */}
                    {logoUrl && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        {/* Position */}
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-2">
                            ตำแหน่ง
                          </label>
                          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                            {[
                              { value: 'left', label: 'ซ้าย', icon: '←' },
                              { value: 'center', label: 'กลาง', icon: '◆' },
                              { value: 'right', label: 'ขวา', icon: '→' },
                            ].map((pos) => (
                              <button
                                key={pos.value}
                                onClick={() => setLogoPosition(pos.value as any)}
                                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${logoPosition === pos.value
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                  }`}
                              >
                                {pos.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Size */}
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-2">
                            ขนาด
                          </label>
                          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                            {[
                              { value: 'small', label: 'เล็ก' },
                              { value: 'medium', label: 'กลาง' },
                              { value: 'large', label: 'ใหญ่' },
                            ].map((size) => (
                              <button
                                key={size.value}
                                onClick={() => setLogoSize(size.value as any)}
                                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${logoSize === size.value
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                  }`}
                              >
                                {size.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">คำอธิบาย</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Form Builder */}
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-300">
                <h2 className="text-lg font-semibold mb-4">คำถาม</h2>
                <FormBuilder fields={fields} onChange={setFields} currentVersion={form.current_version || 0} />
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Theme and Colors - Combined Card */}
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-300">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🎨</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">ธีมและสี</h2>
                    <p className="text-sm text-slate-500">ปรับแต่ง Theme และสีของฟอร์ม</p>
                  </div>
                </div>

                {/* Section 1: Theme Selector */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">รูปแบบฟอร์ม</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { value: 'default', label: 'มาตรฐาน', desc: 'คลาสสิก เรียบง่าย' },
                      { value: 'card-groups', label: 'การ์ดแยกกลุ่ม', desc: 'แบ่งเป็นหมวดหมู่' },
                      { value: 'step-wizard', label: 'ขั้นตอน Step', desc: 'กรอกทีละขั้น' },
                      { value: 'minimal', label: 'มินิมอล', desc: 'เรียบง่ายที่สุด' },
                    ].map((t) => (
                      <label
                        key={t.value}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${theme === t.value
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <input
                          type="radio"
                          name="theme"
                          value={t.value}
                          checked={theme === t.value}
                          onChange={(e) => setTheme(e.target.value as any)}
                          className="sr-only"
                        />
                        <div className="font-medium text-slate-900">{t.label}</div>
                        <div className="text-xs text-slate-500 mt-1">{t.desc}</div>
                      </label>
                    ))}
                  </div>

                  {/* Theme Help Text */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">โครงสร้างฟอร์ม:</span>
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-blue-700">
                      <li className="flex items-start gap-2">
                        <span className="font-medium">Section</span> -
                        {theme === 'card-groups' ? 'เริ่มการ์ดใหม่' :
                          theme === 'step-wizard' ? 'เริ่มขั้นตอนใหม่' :
                            'หัวข้อหลัก (ใหญ่)'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium">Heading</span> -
                        หัวข้อย่อยภายใน Section
                        {theme === 'default' || theme === 'minimal' ? '(เล็กกว่า Section)' : ''}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium">คำถามปกติ</span> - มีเลขลำดับ 1, 2, 3...
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-6 border-t border-slate-200" />

                {/* Section 2: Color Settings */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-4">ตั้งค่าสี</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Banner Color */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-600 mb-3">สี Banner (พื้นหลังหัวเว็บ)</h4>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setBannerColor('blue')}
                          className={`w-8 h-8 rounded-lg bg-[#2563EB] hover:scale-110 transition-all ${bannerColor === 'blue' ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                            }`}
                          title="Blue"
                        />
                        <button
                          onClick={() => setBannerColor('black')}
                          className={`w-8 h-8 rounded-lg bg-[#0F172A] hover:scale-110 transition-all ${bannerColor === 'black' ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                            }`}
                          title="Black"
                        />
                        <button
                          onClick={() => setBannerColor('white')}
                          className={`w-8 h-8 rounded-lg bg-white border-2 border-slate-300 hover:scale-110 transition-all ${bannerColor === 'white' ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                            }`}
                          title="White"
                        />
                        <button
                          onClick={() => document.getElementById('editBannerColorInput')?.click()}
                          className={`w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 border-2 border-slate-300 hover:scale-110 transition-all flex items-center justify-center ${bannerColor === 'custom' ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                            }`}
                          title="Custom"
                        >
                          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                        <input
                          type="color"
                          id="editBannerColorInput"
                          className="absolute opacity-0 pointer-events-none"
                          value={bannerCustomColor}
                          onChange={(e) => {
                            setBannerCustomColor(e.target.value);
                            setBannerColor('custom');
                          }}
                        />
                      </div>
                      {bannerColor === 'custom' && (
                        <p className="text-xs text-slate-500 mt-2">สีที่เลือก: {bannerCustomColor}</p>
                      )}
                    </div>

                    {/* Banner Mode */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-600 mb-3">รูปแบบ Banner</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setBannerMode('gradient')}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${bannerMode === 'gradient'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                          Gradient
                        </button>
                        <button
                          onClick={() => setBannerMode('solid')}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${bannerMode === 'solid'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                          Solid
                        </button>
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-600 mb-3">สีรอง (Button, Heading)</h4>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { key: 'blue', color: '#2563EB' },
                          { key: 'sky', color: '#0EA5E9' },
                          { key: 'teal', color: '#0D9488' },
                          { key: 'emerald', color: '#059669' },
                          { key: 'violet', color: '#7C3AED' },
                          { key: 'rose', color: '#E11D48' },
                          { key: 'orange', color: '#EA580C' },
                          { key: 'slate', color: '#475569' },
                          { key: 'black', color: '#0F172A' },
                        ].map(({ key, color }) => (
                          <button
                            key={key}
                            onClick={() => setAccentColor(key as any)}
                            className={`w-8 h-8 rounded-lg hover:scale-110 transition-all ${accentColor === key ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                              }`}
                            style={{ backgroundColor: color }}
                            title={key}
                          />
                        ))}
                        <button
                          onClick={() => document.getElementById('editAccentColorInput')?.click()}
                          className={`w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 border-2 border-slate-300 hover:scale-110 transition-all flex items-center justify-center ${accentColor === 'custom' ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                            }`}
                          title="Custom"
                        >
                          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                        <input
                          type="color"
                          id="editAccentColorInput"
                          className="absolute opacity-0 pointer-events-none"
                          value={accentCustomColor}
                          onChange={(e) => {
                            setAccentCustomColor(e.target.value);
                            setAccentColor('custom');
                          }}
                        />
                      </div>
                      {accentColor === 'custom' && (
                        <p className="text-xs text-slate-500 mt-2">สีที่เลือก: {accentCustomColor}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-6 border-t border-slate-200" />

                {/* Section 3: Apply Theme Button */}
                <div className="bg-purple-50 rounded-xl p-4 flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium text-purple-900">บันทึกการตั้งค่า Theme และสี</p>
                    <p className="text-purple-700">อัพเดตทันทีโดยไม่ต้อง Publish ใหม่</p>
                  </div>
                  <button
                    onClick={() => setShowApplyThemeModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
                  >
                    <Palette className="w-4 h-4" />
                    Apply Theme
                  </button>
                </div>
              </div>

              {/* Consent Settings */}
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-300">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold">การตั้งค่าความยินยอม</h2>
                </div>
                <label className="flex items-start gap-3 p-4 border-2 border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={requireConsent}
                    onChange={(e) => setRequireConsent(e.target.checked)}
                    className="w-5 h-5 mt-0.5"
                  />
                  <div>
                    <div className="font-medium">ต้องการให้ผู้ตอบกดยินยอมก่อนส่ง</div>
                    <div className="text-sm text-slate-500">บันทึก IP และ timestamp</div>
                  </div>
                </label>
                {requireConsent && (
                  <div className="ml-0 sm:ml-8 mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">หัวข้อ Consent</label>
                      <input
                        type="text"
                        value={consentHeading}
                        onChange={(e) => setConsentHeading(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">ข้อความยินยอม</label>
                      <textarea
                        value={consentText}
                        onChange={(e) => setConsentText(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl resize-none"
                      />
                    </div>
                    <label className="flex items-start gap-3 p-3 border-2 border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={consentRequireLocation}
                        onChange={(e) => setConsentRequireLocation(e.target.checked)}
                        className="w-4 h-4 mt-0.5"
                      />
                      <div>
                        <div className="font-medium">ขอตำแหน่ง GPS</div>
                        <div className="text-sm text-slate-500">ขอพิกัดตำแหน่งจากเบราว์เซอร์</div>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Form Status Settings */}
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-300">
                <h2 className="text-lg font-semibold mb-4">สถานะแบบสอบถาม</h2>

                {/* Active/Inactive Toggle */}
                <div className="flex items-center justify-between p-4 border-2 border-slate-300 rounded-xl">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 mb-1">
                      {isActive ? '🟢 เปิดใช้งาน' : '🔴 ปิดใช้งานชั่วคราว'}
                    </div>
                    <p className="text-sm text-slate-500">
                      {isActive
                        ? 'แบบสอบถามนี้สามารถรับคำตอบได้ตามปกติ'
                        : 'แบบสอบถามนี้ถูกปิดชั่วคราว ผู้ใช้จะไม่สามารถตอบได้'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (isActive) {
                        // ถ้ากำลังเปิดอยู่ และต้องการปิด → แสดง confirmation
                        setShowDeactivateConfirm(true);
                      } else {
                        // ถ้ากำลังปิดอยู่ และต้องการเปิด → เปิดเลย
                        handleToggleActive(true);
                      }
                    }}
                    className={cn(
                      "relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                      isActive ? "bg-green-600" : "bg-slate-400"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        isActive ? "translate-x-6" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* CSS Integration Settings */}
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">เชื่อมต่อระบบ CSS</h2>
                    <p className="text-sm text-slate-500">ส่งข้อมูลการร้องเรียนไปยังระบบ CSS อัตโนมัติ</p>
                  </div>
                </div>

                {/* Enable Toggle */}
                <div className="flex items-center justify-between p-4 border-2 border-slate-300 rounded-xl mb-4">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 mb-1">
                      {cssIntegrationEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </div>
                    <p className="text-sm text-slate-500">
                      {cssIntegrationEnabled
                        ? 'ส่งข้อมูลคำตอบไปยังระบบ CSS อัตโนมัติ'
                        : 'ไม่ส่งข้อมูลไปยังระบบ CSS'}
                    </p>
                  </div>
                  <button
                    onClick={() => setCssIntegrationEnabled(!cssIntegrationEnabled)}
                    className={cn(
                      "relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                      cssIntegrationEnabled ? "bg-green-600" : "bg-slate-400"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        cssIntegrationEnabled ? "translate-x-6" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {/* CSS Config Form */}
                {cssIntegrationEnabled && (
                  <div className="space-y-4">
                    {/* Global Config Notice */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-blue-900">ใช้การตั้งค่าจากเมนูตั้งค่า</p>
                          <p className="text-xs text-blue-700 mt-1">
                            Contact Channel ID และ User Created ID ถูกตั้งค่าในเมนู "ตั้งค่า &gt; API TO CSS"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Field Mapping */}
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 mb-3">แมปฟิลด์ข้อมูล</h3>
                      <p className="text-xs text-slate-500 mb-4">เลือกคำถามที่ต้องการส่งไปยังระบบ CSS</p>

                      <div className="space-y-3">
                        {/* Job Detail Mapping */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            รายละเอียดการร้องเรียน (job_detail) <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={cssFieldMapping.jobDetail}
                            onChange={(e) => setCssFieldMapping({ ...cssFieldMapping, jobDetail: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg bg-white"
                          >
                            <option value="">-- เลือกคำถาม --</option>
                            {fields.filter(f => f.type === 'textarea' || f.type === 'text').map(field => (
                              <option key={field.id} value={field.id}>{field.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Customer Name Mapping */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            ชื่อลูกค้า (customer_name) <span className="text-slate-400">(ไม่บังคับ)</span>
                          </label>
                          <select
                            value={cssFieldMapping.customerName}
                            onChange={(e) => setCssFieldMapping({ ...cssFieldMapping, customerName: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg bg-white"
                          >
                            <option value="">-- เลือกคำถาม --</option>
                            {fields.filter(f => f.type === 'text').map(field => (
                              <option key={field.id} value={field.id}>{field.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Telephone Mapping */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            เบอร์โทรศัพท์ (telephone) <span className="text-slate-400">(ไม่บังคับ)</span>
                          </label>
                          <select
                            value={cssFieldMapping.telephone}
                            onChange={(e) => setCssFieldMapping({ ...cssFieldMapping, telephone: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg bg-white"
                          >
                            <option value="">-- เลือกคำถาม --</option>
                            {fields.filter(f => f.type === 'tel' || f.type === 'text').map(field => (
                              <option key={field.id} value={field.id}>{field.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Email Mapping */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            อีเมล (email) <span className="text-slate-400">(ไม่บังคับ)</span>
                          </label>
                          <select
                            value={cssFieldMapping.email}
                            onChange={(e) => setCssFieldMapping({ ...cssFieldMapping, email: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg bg-white"
                          >
                            <option value="">-- เลือกคำถาม --</option>
                            {fields.filter(f => f.type === 'email' || f.type === 'text').map(field => (
                              <option key={field.id} value={field.id}>{field.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
                      <div className="text-sm">
                        <p className="font-medium text-blue-900">บันทึกการตั้งค่า CSS Integration</p>
                        <p className="text-blue-700">อัพเดตทันทีโดยไม่ต้อง Publish ใหม่</p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/forms/${formId}/css-integration`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                css_integration_enabled: cssIntegrationEnabled,
                                css_field_mapping: cssFieldMapping,
                              }),
                            });
                            
                            if (!response.ok) throw new Error('Failed to save');
                            
                            showToast('success', 'บันทึกการตั้งค่า CSS Integration สำเร็จ');
                          } catch (err) {
                            showToast('error', 'เกิดข้อผิดพลาดในการบันทึก');
                          }
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        บันทึกการตั้งค่า
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <VersionHistory formId={formId} currentVersion={form.current_version || 0} />
          )}

          {activeTab === 'qr-codes' && form && (
            <QRCodeTab formId={formId} formCode={form.code} />
          )}
        </div>
      </div>{/* End Main Card */}

      {/* Full Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-7xl my-4 rounded-xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between z-10 shrink-0">
              <h3 className="font-semibold">ตัวอย่าง</h3>
              <button onClick={handleClosePreview}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-4 bg-slate-100 overflow-y-auto">
              {/* Preview Label */}
              <div className="w-full max-w-4xl mx-auto mb-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                  <Eye className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800">โหมดตัวอย่าง</p>
                    <p className="text-sm text-amber-600">ฟอร์มนี้แสดงตัวอย่างการใช้งานจริง แต่ไม่บันทึกข้อมูล</p>
                  </div>
                </div>
              </div>

              {/* Actual Form Preview */}
              <div className="w-full max-w-4xl mx-auto">
                <FormRenderer
                  form={previewForm}
                  onSubmit={(data) => {
                    alert('นี่คือตัวอย่างฟอร์มเท่านั้น\n\nข้อมูลที่กรอก:\n' + JSON.stringify(data, null, 2));
                  }}
                  submitting={false}
                  submitLabel="ส่งคำตอบ (ตัวอย่าง)"
                />
              </div>

              {/* Bottom spacing */}
              <div className="h-8"></div>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Dialog */}
      <DuplicateFormDialog
        form={form}
        isOpen={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
      />

      {/* Delete Draft Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="ลบ Draft"
        message="ต้องการลบ Draft นี้ใช่หรือไม่? การเปลี่ยนแปลงทั้งหมดจะสูญหาย"
        confirmText="ลบ Draft"
        cancelText="ยกเลิก"
        confirmVariant="danger"
        onConfirm={confirmDeleteDraft}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeactivateConfirm}
        title="ปิดใช้งานแบบสอบถามชั่วคราว"
        message="คุณต้องการปิดแบบสอบถามนี้ชั่วคราวใช่หรือไม่? ผู้ใช้จะไม่สามารถตอบแบบสอบถามได้จนกว่าคุณจะเปิดใช้งานอีกครั้ง"
        confirmText="ปิดใช้งาน"
        cancelText="ยกเลิก"
        confirmVariant="warning"
        onConfirm={() => handleToggleActive(false)}
        onCancel={() => setShowDeactivateConfirm(false)}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        title={successMessage.title}
        message={successMessage.message}
        buttonText="ตกลง"
        onClose={() => setShowSuccessModal(false)}
      />

      {/* Apply Theme Modal */}
      <ApplyThemeModal
        isOpen={showApplyThemeModal}
        onClose={() => {
          setShowApplyThemeModal(false);
          setApplyThemeSuccess(false);
        }}
        onConfirm={handleApplyTheme}
        isLoading={isApplyingTheme}
        isSuccess={applyThemeSuccess}
        themeData={{
          theme,
          bannerColor,
          bannerCustomColor,
          bannerMode,
          accentColor,
          accentCustomColor,
        }}
      />

      {/* Toast -->
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
            {toast.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Discard Draft Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold">ยืนยันการละทิ้ง Draft</h3>
            </div>

            <p className="text-slate-600 mb-4">
              คุณแน่ใจหรือไม่ว่าต้องการละทิ้ง Draft นี้?
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">คำเตือน:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>การเปลี่ยนแปลงทั้งหมดจะสูญหาย</li>
                    <li>ฟอร์มจะกลับไปใช้ Version ที่ Publish ล่าสุด</li>
                    <li>ไม่สามารถกู้คืนได้</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 py-2.5 px-4 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDiscardDraft}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
              >
                ละทิ้ง Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Draft Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center gap-3 text-green-600 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Rocket className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold">
                {form?.status === 'published' ? 'Publish Draft' : 'Publish ฟอร์ม'}
              </h3>
            </div>

            <p className="text-slate-600 mb-4">
              {form?.status === 'published' 
                ? 'Draft นี้จะกลายเป็น Version ใหม่ที่ใช้งานจริง ผู้ใช้จะเห็นการเปลี่ยนแปลงทันที'
                : 'ฟอร์มนี้จะถูก Publish และสามารถใช้งานได้ทันที'
              }
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  บันทึกการเปลี่ยนแปลง (Change Summary)
                </label>
                <textarea
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="เช่น: แก้ไขคำถามข้อ 3, เพิ่มตัวเลือกใหม่..."
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPublishModal(false);
                  setChangeSummary('');
                }}
                className="flex-1 py-2.5 px-4 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={form?.status === 'published' ? handlePublishDraft : handlePublish}
                disabled={isSaving}
                className="flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
              >
                {isSaving ? 'กำลัง Publish...' : (form?.status === 'published' ? 'Publish Draft' : `Publish v${draftVersion?.version ?? ((form?.current_version ?? 0) + 1)}`)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
