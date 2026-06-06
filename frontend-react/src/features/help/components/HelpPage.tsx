import { useState, useMemo } from "react";
import { ExternalLink, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import SegmentedControl from "@/shared/components/ui/segmented-control";
import { getUserRole } from "@/shared/lib/auth";

type Tab = "manual" | "faq";

export default function HelpPage() {
  const role = getUserRole();
  const [activeTab, setActiveTab] = useState<Tab>("faq");
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
  const [faqSearch, setFaqSearch] = useState("");

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handlePrint = () => {
    window.open("/MM Torres Optical User Manual.pdf", "_blank");
  };

  const manualSections = useMemo(() => {
    const sections = [
      {
        title: "System Overview",
        content: (
          <div className="space-y-3">
            <p>
              The MM Torres Optical Clinic Management System is a comprehensive web-based platform designed
              to streamline the daily operations of an optical clinic. It provides end-to-end management of
              inventory, billing and payment transactions, patient records (admin only), user accounts, and system administration.
            </p>
            <p>The system serves two user roles:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li><strong>Administrator</strong> — Full access to all modules including Dashboard, patient management, user management, reports, and database maintenance.</li>
              <li><strong>Staff</strong> — Access to billing and payment, inventory management, and transaction records. Admin-only pages like Dashboard, Patients, Registration, and Maintenance are not visible.</li>
            </ul>
            <p>
              Built with a modern technology stack, the system ensures data security through role-based access
              control, JWT authentication, and encrypted password storage. All transactions are logged for
              audit purposes, and data can be backed up and restored on demand.
            </p>
          </div>
        ),
      },
      {
        title: "Module Access Instructions",
        content: (
          <div className="space-y-4">
            {role === "ADMIN" && (
              <div>
                <h4 className="font-semibold">Dashboard (Admin only)</h4>
                <p className="text-muted-foreground">
                  The <em>Dashboard</em> provides a high-level overview of key metrics including daily revenue,
                  patient registrations, and inventory status. Staff users do not have access to the Dashboard
                  and are directed to the Billing and Payment page upon login.
                </p>
              </div>
            )}
            <div>
              <h4 className="font-semibold">Billing and Payment</h4>
              <p className="text-muted-foreground">
                Accessible from the sidebar under <em>Billing and Payment</em>. Create sales by selecting
                products (grouped by physical products and services), applying payments via cash or GCash,
                and completing transactions. Receipts can be printed or viewed after each sale.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Inventory Management</h4>
              {role === "ADMIN" ? (
                <p className="text-muted-foreground">
                  Navigate to <em>Inventory Management</em> in the sidebar. View products, filter by category,
                  and check stock levels. Add and edit products using the respective buttons. Product archiving
                  and restoration is available under <em>Maintenance &gt; Inventory Maintenance</em>.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Navigate to <em>Inventory Management</em> in the sidebar. View products, filter by category,
                  and check stock levels. Adding, editing, and archiving products are restricted to administrators.
                </p>
              )}
            </div>
            <div>
              <h4 className="font-semibold">Sales and Transactions</h4>
              <p className="text-muted-foreground">
                The <em>Sales and Transactions</em> page lists all completed sales with filtering by status and date range.
                Click any transaction to view details, process refunds, or add additional payments.
              </p>
            </div>
            {role === "ADMIN" && (
              <>
                <div>
                  <h4 className="font-semibold">Patient Management (Admin only)</h4>
                  <p className="text-muted-foreground">
                    Manage patient profiles, prescriptions, eye exam records, and health history from the
                    <em> Patient Management</em> section. Each patient record includes personal details,
                    prescription tracking, and health history logs.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Registration (Admin only)</h4>
                  <p className="text-muted-foreground">
                    Under <em>Registration</em>, create, edit, and view user accounts. Assign roles (Admin or Staff)
                    and set security questions for password recovery.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Maintenance (Admin only)</h4>
                  <p className="text-muted-foreground">
                    The <em>Maintenance</em> section allows administrators to create password-protected database
                    backups and restore from previous backup files. It also includes the Audit Trail for reviewing
                    system activity, and sub-pages for managing archived users, patients, and inventory.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Reports (Admin only)</h4>
                  <p className="text-muted-foreground">
                    Generate reports on inventory valuation, patient demographics, and transaction summaries.
                    Export filtered data as PDF for record-keeping or sharing.
                  </p>
                </div>
              </>
            )}
            <div>
              <h4 className="font-semibold">Help &amp; About</h4>
              <p className="text-muted-foreground">
                The <em>Help</em> section (this page) provides a printable user manual and FAQs.
                The <em>About</em> section displays company information and the technology stack.
              </p>
            </div>
            {role === "STAFF" && (
              <div>
                <h4 className="font-semibold">Restricted Modules</h4>
                <p className="text-muted-foreground">
                  As a Staff user, the following modules are not available: Dashboard, Patient Management,
                  Registration, Maintenance, and Reports. If you need access to any of these,
                  please contact your system administrator.
                </p>
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Compatibility Guide",
        content: (
          <div className="space-y-3">
            <p>The MM Torres Optical Clinic Management System is a web-based application compatible with all major modern browsers.</p>
            <div>
              <h4 className="font-semibold">Supported Browsers</h4>
              <ul className="list-disc space-y-1 pl-6">
                <li>Google Chrome 90+</li>
                <li>Mozilla Firefox 88+</li>
                <li>Microsoft Edge 90+</li>
                <li>Safari 14+</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Screen Resolution</h4>
              <p className="text-muted-foreground">
                The system is optimized for desktop use at a minimum resolution of 1280×720 pixels.
                A resolution of 1920×1080 or higher is recommended for the best experience.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Network Requirements</h4>
              <p className="text-muted-foreground">
                A stable internet or local network connection to the backend server is required.
                The system operates over HTTP/HTTPS and requires ports 8080 (backend) and 5174 (frontend dev)
                or 80/443 (production) to be accessible.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Printing</h4>
              <p className="text-muted-foreground">
                The user manual is available as a PDF. Use the <em>Open User Manual (PDF)</em> button at the top of
                this page to view or download it.
              </p>
            </div>
          </div>
        ),
      },
    ];
    return sections;
  }, [role]);

  const commonFaqItems = [
    {
      question: "How do I reset my password?",
      answer:
        "On the login page, click 'Forgot Password'. You will be prompted to enter your username and answer your security question. If you cannot remember your security answer, contact an administrator who can reset your password from the User Management module.",
    },
    {
      question: "Why am I being asked to change my password?",
      answer:
        "The system enforces a password change when an administrator resets your account password or when your account is newly created. This ensures only you know your password. Enter your current temporary password, then set a new secure password.",
    },
    {
      question: "What payment methods are supported?",
      answer:
        "The system supports two payment methods: Cash and GCash. Multiple payments can be applied to a single transaction. For GCash payments, a GCash mobile number (10–15 characters) and a reference number are required. Cash payments may allow change to be given if the tendered amount exceeds the total.",
    },
    {
      question: "What should I do if the system is running slowly?",
      answer:
        "Try clearing your browser cache and cookies, then restart the browser. If the issue persists, check that the server machine has adequate resources (RAM and disk space). Large transaction volumes may require periodic database maintenance. Contact your system administrator if performance does not improve.",
    },
    {
      question: "I see an 'Unauthorized' error when trying to access a page.",
      answer:
        "This usually means your session has expired or you do not have the required role for that module. Try logging out and logging back in. If the problem persists, verify with your administrator that your account has the correct role assignment.",
    },
  ];

  const adminFaqItems = [
    {
      question: "How do I create a database backup?",
      answer:
        "Navigate to Maintenance &gt; Backup and Restore. Click 'Create Backup', enter a password to protect the backup file, and confirm. The backup file will download to your computer. Keep this file secure — it contains all system data.",
    },
    {
      question: "How do I restore from a backup?",
      answer:
        "Navigate to Maintenance &gt; Backup and Restore, click 'Restore Backup', and select a previously downloaded backup file. Enter the password used when the backup was created and confirm. Note: restoration replaces all current data with the backup contents.",
    },
    {
      question: "What password do I use for backup and restore?",
      answer:
        "Both backup and restore require the password of the currently logged-in administrator. This is the same password you use to log in to the system. The backup file itself is protected by a separate password you set when creating the backup — you will need this same password when restoring from that file.",
    },
    {
      question: "How do I generate and export reports?",
      answer:
        "Go to Reports in the sidebar. Use the segmented control to switch between Inventory Analytics, Transactions, and Patients. For transaction and patient reports, you can set a date range using the filter inputs. Click 'Export as PDF' or 'Export as Excel' to download the report. All report exports are recorded in the Audit Trail.",
    },
    {
      question: "What do the Dashboard metrics mean?",
      answer:
        "The Dashboard provides a high-level overview: Today's Revenue is cash collected today. Orders Awaiting Pickup are completed sales not yet picked up. Needs Reordering shows products below their reorder point — click it to view them in inventory. Active Inventory Value is the total cost value of all active stock. Receivables are outstanding customer balances. Revenue Month-to-Date is net revenue for the current month. Avg. Transaction Value is the mean amount per transaction.",
    },
    {
      question: "How do I adjust stock levels for a product?",
      answer:
        "Go to Inventory Management, find the product, and click the View button. In the product detail view, click the stock adjustment button. Choose 'Add Stock' or 'Remove Stock', enter the quantity, and select or type a reason. A preview shows the resulting stock level before you confirm. All adjustments are recorded in the Audit Trail.",
    },
    {
      question: "How do I reset a user's password?",
      answer:
        "Go to Registration, find the user, and click Edit. In the edit form, click 'Reset Password' and enter a temporary password. The user will be required to change their password and set a security question the next time they log in.",
    },
    {
      question: "Why is a new user forced to change their password on first login?",
      answer:
        "When an administrator creates a new user account or resets a user's password, the system flags the account for a mandatory password change. This ensures that only the user knows their password and that administrators cannot access other accounts. The user must also set up a security question during this process.",
    },
    {
      question: "How do I manage product categories and suppliers?",
      answer:
        "When adding or editing a product, click the gear icon next to the Category or Supplier field. This opens a management modal where you can view all categories or suppliers, toggle their active/inactive status, or delete ones that have no associated products. To add a new category or supplier, simply type a new name in the product form's combobox field and select 'Create'.",
    },
    {
      question: "How do I view a patient's prescription history?",
      answer:
        "Go to Patient Management, find the patient, and click the View button. The patient profile displays all prescriptions and health history records. You can add new prescriptions or edit existing ones from this view.",
    },
    {
      question: "How do I log a patient visit?",
      answer:
        "Go to Patient Management, find the patient, and click the View button. Click 'Log Visit' to open the visit dialog. Select a date and time, choose a visit purpose (such as Eye Check-up, Frame Fitting, Pick-up, or Consultation), and optionally add notes. If the patient has a pending follow-up, you can link the visit to it.",
    },
    {
      question: "How do I add or record eye exams for a patient?",
      answer:
        "Open the patient's profile and navigate to the Eye Exams tab. Click 'Add Eye Exam' to record new exam findings including visual acuity, refraction measurements, and clinical notes. You can also view and edit previous eye exam records from this tab.",
    },
    {
      question: "What happens when a product is archived?",
      answer:
        "Archiving a product hides it from the main product list and the billing and payment interface. It does not delete historical transaction data. Archived products can be restored by an administrator from Maintenance &gt; Inventory Maintenance.",
    },
    {
      question: "What happens when a user account is archived?",
      answer:
        "Archiving a user disables their login — they can no longer access the system. Their account and historical data (such as processed transactions) are preserved. You cannot archive your own account. Archived users can be restored at any time from Maintenance &gt; User Maintenance.",
    },
    {
      question: "How do I register a new user account?",
      answer:
        "Go to Registration and click 'Add User'. Fill in the personal information, set a username and password, assign a role (Admin or Staff), and set a security question for password recovery. The new user will be prompted to change their password on first login.",
    },
    {
      question: "How do I add or edit a product in inventory?",
      answer:
        "Go to Inventory Management and click 'Add Product' to create a new product, or find an existing product and click the Edit icon. Fill in or update the product details including name, category, supplier, price, cost, and stock quantity. You can also upload a product image. Changes do not affect previously completed transactions.",
    },
    {
      question: "How do I process a refund?",
      answer:
        "Navigate to Sales and Transactions and click on the transaction you want to refund. In the transaction detail view, click 'Refund Item(s)' to enter selection mode. Check the items to refund and click 'Prepare Refund'. In the refund drawer, set the quantity and reason for each item, choose a refund method (Cash or GCash), and confirm. A refund receipt will be generated. Restocked quantities are automatically added back to inventory for physical items.",
    },
    {
      question: "How do I use the Audit Trail?",
      answer:
        "The Audit Trail is found under Maintenance. It logs all system actions including login/logout, creating or updating records, archiving, voiding transactions, and database backups. You can filter by action type, resource type, and date range to review specific activities. Click the View button on any entry to see full details and navigate to the related record.",
    },
  ];

  const staffFaqItems = [
    {
      question: "How do I process a sale in Billing and Payment?",
      answer:
        "Go to Billing and Payment. Select products from the left panel — toggle between Physical Products and Services using the tabs at the top. Click the Add to Cart (plus) button for each item. You can search for products by name and filter by category. Once items are in the cart, click 'Pay' to open the payment drawer, choose a payment method, and complete the transaction. A receipt will be generated.",
    },
    {
      question: "How do I associate a patient with a sale?",
      answer:
        "In the Billing and Payment page, click 'Associate Patient' in the customer section on the right panel. Search for the patient by name, contact number, or ID, then click 'Select Patient'. Linking a patient is optional for full payments but required for deposits (partial payments). You can remove the linked patient by clicking the X button.",
    },
    {
      question: "How do I load a patient's prescription items into the cart?",
      answer:
        "After associating a patient with the sale, the patient section expands to show their prescriptions. Select a prescription from the dropdown and click 'Load to Cart'. The recommended products will be added automatically. Items already in the cart are skipped and will not be duplicated.",
    },
    {
      question: "How do I apply a Senior or PWD discount?",
      answer:
        "In the Billing and Payment cart, check the 'Apply Senior / PWD Discount' checkbox. You must fill in the customer's Full Name (as printed on their ID), Home Address, and Senior/PWD ID Number. Once all three fields are completed, eligible items will automatically receive a 20% discount. Note: while the Senior/PWD discount is active, manual discounts on eligible items are locked.",
    },
    {
      question: "How do I apply a discount to a specific item in the cart?",
      answer:
        "In the cart, click 'Add Discount' below the item you want to discount. Choose the discount type — Fixed (₱) or Percent (%) — and enter the value. Press Enter to apply. Percentage discounts cannot exceed 100%, and fixed discounts cannot exceed the item subtotal. To remove a discount, click the green discount badge on the item.",
    },
    {
      question: "How do I process a GCash payment?",
      answer:
        "In the payment drawer, click the GCash button. Enter the GCash mobile number (must start with 09 and be 11 digits), the reference number from the GCash transaction, and the amount tendered. For GCash, the amount is capped at the total — overpayment is not allowed. Complete the payment to finish the transaction.",
    },
    {
      question: "How do I accept a deposit (partial payment)?",
      answer:
        "In the payment drawer, enter an amount that is less than the total. The minimum deposit is 50% of the grand total. Deposits require a linked patient with a linked prescription — if either is missing, you will see a warning message. When using GCash, the amount is capped at the total so deposits must be made with Cash. A deposit receipt will show the remaining balance.",
    },
    {
      question: "How do I settle the remaining balance on a deposit transaction?",
      answer:
        "Navigate to Sales and Transactions, find the deposit transaction, and click View. An 'Add Payment' button will appear for deposit transactions. The remaining balance must be settled in full — partial payments are not allowed for the second payment. Choose Cash or GCash and complete the payment.",
    },
    {
      question: "How do I reprint a receipt?",
      answer:
        "Go to Sales and Transactions, find the transaction, and click View. In the Payment Details section, click 'Reprint Receipt' to open the original receipt for printing. You can also click 'Statement of Account' to view or print an amended statement that includes any refunds or adjustments.",
    },
    {
      question: "How do I adjust stock levels for a product?",
      answer:
        "Go to Inventory Management, find the product, and click View. In the product detail page, click 'Adjust Stock'. Choose 'Add Stock' or 'Remove Stock', enter the quantity, and select or type a reason. A preview shows the resulting stock level before you confirm. This is useful for recording deliveries, damaged items, or inventory corrections.",
    },
    {
      question: "What do the stock status badges mean?",
      answer:
        "In the Inventory Management table, each product has a stock status badge: 'Normal' (green) means stock is at a healthy level. 'Reorder' (yellow) means stock is at or below the reorder point and needs restocking. 'Out of Stock' (red) means quantity is zero. 'Overstocked' (yellow) means stock exceeds the overstock threshold. 'Service' appears for service-type products which have no stock tracking.",
    },
    {
      question: "What happens to my cart if I refresh the page?",
      answer:
        "Your cart is automatically saved and will persist if you refresh the page or navigate away within the same browser session. However, if you close the browser entirely, the cart will be cleared. If an administrator archives a product while it is in your cart, it will be removed automatically with a notification.",
    },
    {
      question: "How do I look up a product in inventory?",
      answer:
        "Go to Inventory Management. Use the search bar to find products by name. You can filter by category and sort by name, quantity, or price. Use the stock filter to view only products that are out of stock, need reordering, or are overstocked. Click the View button on any product to see its full details including stock levels, sales history, and reorder information.",
    },
    {
      question: "How do I view past transactions?",
      answer:
        "Go to Sales and Transactions to see a list of all completed sales. Use the search bar to find a specific transaction number, and filter by status (Deposit, Paid, Voided) or by date range. You can also sort by date or amount. Click the View button on any transaction to see its full details, payment history, and refund records.",
    },
    {
      question: "What do the transaction status badges mean?",
      answer:
        "Transactions have two types of status badges. Financial status: 'Paid' means the full amount has been collected, 'Deposit' means a partial payment has been made with a balance remaining, and 'Voided' means the transaction has been cancelled. Fulfillment status: 'Pending Lab' means the order is being prepared, 'Ready for Pickup' means the order is ready for the customer, and 'Completed' means the customer has picked up the order. Refund status shows if any items were partially or fully refunded.",
    },
    {
      question: "What actions are restricted for Staff users?",
      answer:
        "Staff users cannot access the Dashboard, Patient Management, Registration, Maintenance, or Reports modules. Within Inventory Management, staff can view products and check stock but cannot add, edit, or archive products. Processing refunds, voiding transactions, and marking fulfillment statuses (Ready for Pickup, Picked Up) are restricted to administrators. If you need to perform any restricted action, please ask your system administrator.",
    },
  ];

  const faqItems = useMemo(() => {
    const items = [...commonFaqItems];
    if (role === "ADMIN") items.push(...adminFaqItems);
    if (role === "STAFF") items.push(...staffFaqItems);
    return items;
  }, [role]);

  const filteredFaqs = useMemo(() => {
    if (!faqSearch.trim()) return faqItems;
    const q = faqSearch.toLowerCase();
    return faqItems.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
    );
  }, [faqItems, faqSearch]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="print:hidden">
        <h1 className="text-2xl font-bold tracking-tight">Help Center</h1>
        <p className="text-muted-foreground">User manual and frequently asked questions</p>
      </div>

      {/* Segmented control */}
      <SegmentedControl
        options={[
          { value: "faq", label: "Frequently Asked Questions" },
          { value: "manual", label: "User Manual" },
        ]}
        value={activeTab}
        onChange={(value) => {
          setActiveTab(value as Tab);
          setFaqSearch("");
          setOpenFaqs(new Set());
        }}
        className="print:hidden"
      />

      {/* Open PDF button */}
      {activeTab === "manual" && (
        <div className="print:hidden flex justify-end">
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Open User Manual (PDF)
          </Button>
        </div>
      )}

      {/* Print-only header */}
      <div className="hidden print:block print:mb-8">
        <h1 className="text-xl font-bold">MM Torres Optical Clinic — User Manual</h1>
        <p className="text-sm text-gray-500">Printed on {new Date().toLocaleDateString()}</p>
      </div>

      {/* User Manual Content */}
      {activeTab === "manual" && (
        <div className="space-y-6">
          {manualSections.map((section) => (
            <Card key={section.title} className="print:shadow-none print:border print:border-gray-200">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>{section.content}</CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* FAQ Content */}
      {activeTab === "faq" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={faqSearch}
              onChange={(e) => {
                setFaqSearch(e.target.value);
                setOpenFaqs(new Set());
              }}
              className="pl-9"
            />
          </div>
          {filteredFaqs.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No questions match your search.
            </p>
          )}
          {filteredFaqs.map((item, index) => (
            <Card key={item.question} className="overflow-hidden">
              <button
                onClick={() => toggleFaq(index)}
                className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium">{item.question}</span>
                {openFaqs.has(index) ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {openFaqs.has(index) && (
                <div className="border-t px-6 py-4">
                  <p className="text-muted-foreground">{item.answer}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
