'use client';

import { Badge, Card, Container, Divider, Group, Stack, Text, Title } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { AppButton, FormCheckbox, FormSelect, FormTextarea, FormTextInput } from '@ronas-it/web/shared/ui/ui-kit';
import type { ReactElement } from 'react';

interface DemoFormValues {
  name: string;
  role: string | null;
  bio: string;
  subscribe: boolean;
}

export default function Index(): ReactElement {
  const t = useTranslations('web-shared.HOME_PAGE');
  const { control, handleSubmit } = useForm<DemoFormValues>({
    defaultValues: { name: '', role: null, bio: '', subscribe: false },
  });

  const onSubmit = handleSubmit((values): void => {
    // eslint-disable-next-line no-console
    console.log(values);
  });

  return (
    <Container size='sm' py='xl'>
      <Stack gap='lg'>
        <div>
          <Title order={1}>{t('TEXT_TITLE')}</Title>
          <Text c='dimmed'>{t('TEXT_SUBTITLE')}</Text>
        </div>

        <Card withBorder radius='md' padding='lg'>
          <Stack gap='md'>
            <Title order={3}>{t('TEXT_MANTINE_SECTION_TITLE')}</Title>
            <Group>
              <Badge color='brandPrimary'>{t('TEXT_BADGE_PRIMARY')}</Badge>
              <Badge color='brandSecondary'>{t('TEXT_BADGE_SECONDARY')}</Badge>
            </Group>
            <Text>{t('TEXT_MANTINE_SECTION_DESCRIPTION')}</Text>
          </Stack>
        </Card>

        <Divider label={t('TEXT_BUTTONS_SECTION_TITLE')} labelPosition='center' />

        <Group>
          <AppButton>{t('BUTTON_DEFAULT')}</AppButton>
          <AppButton variant='outline'>{t('BUTTON_OUTLINE')}</AppButton>
          <AppButton isLoading>{t('BUTTON_LOADING')}</AppButton>
          <AppButton shouldUseUnderConstructionTooltip>{t('BUTTON_UNDER_CONSTRUCTION')}</AppButton>
        </Group>

        <Divider label={t('TEXT_FORM_SECTION_TITLE')} labelPosition='center' />

        <Card withBorder radius='md' padding='lg'>
          <form onSubmit={onSubmit}>
            <Stack gap='md'>
              <FormTextInput control={control} name='name' label={t('TEXT_FIELD_NAME')} placeholder='Jane Doe' />
              <FormSelect
                control={control}
                name='role'
                label={t('TEXT_FIELD_ROLE')}
                placeholder={t('TEXT_FIELD_ROLE_PLACEHOLDER')}
                data={[t('TEXT_ROLE_ENGINEER'), t('TEXT_ROLE_DESIGNER'), t('TEXT_ROLE_PRODUCT_MANAGER')]}
              />
              <FormTextarea control={control} name='bio' label={t('TEXT_FIELD_BIO')} />
              <FormCheckbox control={control} name='subscribe' label={t('TEXT_FIELD_SUBSCRIBE')} />
              <Group justify='flex-end'>
                <AppButton type='submit'>{t('BUTTON_SUBMIT')}</AppButton>
              </Group>
            </Stack>
          </form>
        </Card>
      </Stack>
    </Container>
  );
}
