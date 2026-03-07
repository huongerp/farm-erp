import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  Save, Building2, MapPin, Phone, Mail, Globe, Hash, Image as ImageIcon, X, Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import { companySchema } from '../core/schema';
import type { CompanyFormValues } from '../core/types';

const LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export interface CompanyFormProps {
  /** Giá trị ban đầu (từ store) */
  initialValues: CompanyFormValues & { appLogo?: string | null };
  /** Callback khi submit thành công – nhận data form + logo preview */
  onSubmit: (data: CompanyFormValues & { appLogo: string | null }) => void;
}

const CompanyInfoForm: React.FC<CompanyFormProps> = ({ initialValues, onSubmit }) => {
  const { t } = useTranslation();
  const [logoPreview, setLogoPreview] = useState<string | null>(initialValues.appLogo ?? null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      appName: initialValues.appName,
      appDescription: initialValues.appDescription ?? '',
      companyName: initialValues.companyName,
      taxId: initialValues.taxId,
      address: initialValues.address ?? '',
      phone: initialValues.phone ?? '',
      email: initialValues.email ?? '',
      website: initialValues.website ?? '',
    },
  });

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error(t('company.imageTypeError'));
        return;
      }
      if (file.size > LOGO_MAX_SIZE_BYTES) {
        toast.error(t('company.imageSizeError'));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    },
    [t]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const removeLogo = () => {
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onFormSubmit = async (data: CompanyFormValues) => {
    await onSubmit({ ...data, appLogo: logoPreview });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Branding Column */}
      <div className="md:col-span-1 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card p-5 rounded-xl border border-border shadow-sm"
        >
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" /> {t('company.brandSection')}
          </h3>

          <div className="space-y-4">
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-4 p-6 border-2 border-dashed rounded-xl relative group transition-all cursor-pointer ${
                isDragging
                  ? 'bg-primary/5 border-primary scale-[1.02]'
                  : 'bg-muted/50 border-border hover:border-primary/50 hover:bg-muted/80'
              }`}
            >
              {logoPreview ? (
                <div className="relative group/preview" onClick={(e) => e.stopPropagation()}>
                  <img src={logoPreview} alt="App Logo" className="h-24 w-24 object-contain" />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-3 -right-3 bg-card rounded-full p-1 shadow-md border border-border text-muted-foreground hover:text-red-500 hover:scale-110 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  className={`h-24 w-24 rounded-full flex items-center justify-center transition-colors ${
                    isDragging ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <ImageIcon size={32} />
                </div>
              )}

              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground flex-wrap">
                  {isDragging ? (
                    <span className="text-primary">{t('company.dropImage')}</span>
                  ) : (
                    <>
                      <span>{t('company.upload')}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span>{t('company.dragDrop')}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span className="flex items-center gap-1">
                        <Camera size={12} /> {t('company.capture')}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground px-4">{t('company.imageHint')}</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <Input
                  label={t('company.appName')}
                  placeholder={t('company.appNamePlaceholder')}
                  {...register('appName')}
                  error={errors.appName?.message}
                />
                <p className="text-xs text-muted-foreground italic">{t('company.appNameHint')}</p>
              </div>
              <div className="space-y-1">
                <Input
                  label={t('company.appDescription')}
                  placeholder={t('company.appDescPlaceholder')}
                  {...register('appDescription')}
                  error={errors.appDescription?.message}
                />
                <p className="text-xs text-muted-foreground italic">{t('company.appDescHint')}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Company Info Column */}
      <div className="md:col-span-2 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card p-5 rounded-xl border border-border shadow-sm"
        >
          <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2 border-b border-border pb-3">
            <Building2 className="w-4 h-4 text-muted-foreground" /> {t('company.legalSection')}
          </h3>

          <div className="grid gap-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Input
                  label={t('company.companyName')}
                  placeholder={t('company.companyNamePlaceholder')}
                  icon={<Building2 className="w-4 h-4 text-muted-foreground" />}
                  {...register('companyName')}
                  error={errors.companyName?.message}
                />
              </div>
              <Input
                label={t('company.taxId')}
                placeholder={t('company.taxIdPlaceholder')}
                icon={<Hash className="w-4 h-4 text-muted-foreground" />}
                {...register('taxId')}
                error={errors.taxId?.message}
              />
              <Input
                label={t('company.phone')}
                placeholder={t('company.phonePlaceholder')}
                icon={<Phone className="w-4 h-4 text-muted-foreground" />}
                {...register('phone')}
                error={errors.phone?.message}
              />
              <Input
                label={t('company.email')}
                placeholder={t('company.emailPlaceholder')}
                icon={<Mail className="w-4 h-4 text-muted-foreground" />}
                {...register('email')}
                error={errors.email?.message}
              />
              <Input
                label={t('company.website')}
                placeholder={t('company.websitePlaceholder')}
                icon={<Globe className="w-4 h-4 text-muted-foreground" />}
                {...register('website')}
                error={errors.website?.message}
              />
              <div className="md:col-span-2">
                <Input
                  label={t('company.address')}
                  placeholder={t('company.addressPlaceholder')}
                  icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
                  {...register('address')}
                  error={errors.address?.message}
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end pt-2"
        >
          <Button type="submit" size="lg" className="w-full md:w-auto shadow-lg shadow-primary/20" isLoading={isSubmitting}>
            <Save className="w-4 h-4 mr-2" /> {t('company.saveButton')}
          </Button>
        </motion.div>
      </div>
    </form>
  );
};

export default CompanyInfoForm;
