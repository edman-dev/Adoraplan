import { AlertCircle, Calendar, CreditCard, DollarSign, Receipt, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PlaceholderSection } from '@/components/placeholder-section';
import { TitleBar } from '@/features/dashboard/TitleBar';

const SubscriptionPage = () => {
  const t = useTranslations('Subscription');

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      {/* Subscription Management Layout */}
      <div className="space-y-6">
        {/* Stripe Integration Notice */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Integration Note:</strong>
              {' '}
              This section will integrate with the existing Stripe subscription functionality already configured in the project.
            </p>
          </div>
        </div>

        {/* Main Subscription Overview */}
        <div className="rounded-lg border bg-card p-6">
          <PlaceholderSection
            title={t('message_state_title')}
            description={t('message_state_description')}
            icon={CreditCard}
            additionalInfo="Future features will include subscription plans, billing management, and payment processing integration with Stripe"
          />
        </div>

        {/* Billing Management Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Current Plan */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Current Plan"
              description="View active subscription details"
              icon={Calendar}
              variant="compact"
              additionalInfo="Will display current plan details, billing cycle, and subscription status from Stripe"
            />
          </div>

          {/* Billing History */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Billing History"
              description="View payment history and invoices"
              icon={Receipt}
              variant="compact"
              additionalInfo="Will show payment history, invoices, and receipts managed through Stripe"
            />
          </div>

          {/* Payment Methods */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Payment Methods"
              description="Manage payment information"
              icon={CreditCard}
              variant="compact"
              additionalInfo="Will allow updating payment methods using Stripe's secure payment processing"
            />
          </div>
        </div>

        {/* Plan Management */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Plan Options */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Subscription Plans"
              description="Available subscription options"
              icon={DollarSign}
              variant="compact"
              additionalInfo="Will display available plans and pricing managed through Stripe pricing configuration"
            />
          </div>

          {/* Billing Settings */}
          <div className="rounded-lg border bg-card p-4">
            <PlaceholderSection
              title="Billing Settings"
              description="Subscription preferences and settings"
              icon={Settings}
              variant="compact"
              additionalInfo="Will integrate with Stripe Customer Portal for self-service billing management"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SubscriptionPage;
