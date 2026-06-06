import { useState, useMemo, type ReactNode } from "react";
import { ExternalLink, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import SegmentedControl from "@/shared/components/ui/segmented-control";
import { getUserRole } from "@/shared/lib/auth";

type Tab = "manual" | "faq";

type FaqItem = {
  question: string;
  answer: string | ReactNode;
};

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
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>On the login page, click <strong>Forgot Password</strong>.</li>
            <li>Enter your username and answer your security question.</li>
            <li>If you cannot remember your security answer, contact an administrator who can reset your password from the User Management module.</li>
          </ol>
        </div>
      ),
    },
    {
      question: "Why am I being asked to change my password?",
      answer:
        "The system enforces a password change when an administrator resets your account password or when your account is newly created. This ensures only you know your password. Enter your current temporary password, then set a new secure password.",
    },
    {
      question: "What payment methods are supported?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <p>The system supports two payment methods:</p>
          <ul className="space-y-1.5">
            <li><strong>Cash</strong> — Change may be given if the tendered amount exceeds the total.</li>
            <li><strong>GCash</strong> — Requires a GCash mobile number (10–15 characters) and a reference number. Amount is capped at the total (no overpayment).</li>
          </ul>
          <p>Multiple payments can be applied to a single transaction.</p>
        </div>
      ),
    },
    {
      question: "What should I do if the system is running slowly?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <p>Try these steps in order:</p>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Clear your browser cache and cookies, then restart the browser.</li>
            <li>Check that the server machine has adequate resources (RAM and disk space).</li>
            <li>Large transaction volumes may require periodic database maintenance.</li>
          </ol>
          <p>Contact your system administrator if performance does not improve.</p>
        </div>
      ),
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
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Navigate to <strong>Maintenance &gt; Backup and Restore</strong>.</li>
            <li>Click <strong>Create Backup</strong>.</li>
            <li>Enter a password to protect the backup file and confirm.</li>
          </ol>
          <p>The backup file will download to your computer. Keep this file secure — it contains all system data.</p>
        </div>
      ),
    },
    {
      question: "How do I restore from a backup?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Navigate to <strong>Maintenance &gt; Backup and Restore</strong>.</li>
            <li>Click <strong>Restore Backup</strong> and select a previously downloaded backup file.</li>
            <li>Enter the password used when the backup was created and confirm.</li>
          </ol>
          <p><strong>Note:</strong> Restoration replaces all current data with the backup contents.</p>
        </div>
      ),
    },
    {
      question: "What password do I use for backup and restore?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <p>There are two passwords involved:</p>
          <ul className="space-y-1.5">
            <li><strong>Login password</strong> — Both backup and restore require the password of the currently logged-in administrator (the same password you use to log in to the system).</li>
            <li><strong>Backup file password</strong> — The backup file itself is protected by a separate password you set when creating the backup. You will need this same password when restoring from that file.</li>
          </ul>
        </div>
      ),
    },
    {
      question: "How do I generate and export reports?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Go to <strong>Reports</strong> in the sidebar.</li>
            <li>Use the segmented control to switch between <strong>Inventory Analytics</strong>, <strong>Transactions</strong>, and <strong>Patients</strong>.</li>
            <li>For transaction and patient reports, set a date range using the filter inputs.</li>
            <li>Click <strong>Export as PDF</strong> or <strong>Export as Excel</strong> to download the report.</li>
          </ol>
          <p>All report exports are recorded in the Audit Trail.</p>
        </div>
      ),
    },
    {
      question: "What do the Dashboard metrics mean?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <p>The Dashboard provides a high-level overview of your clinic's operations:</p>
          <ul className="space-y-1.5">
            <li><strong>Today&apos;s Revenue</strong> — Cash collected today.</li>
            <li><strong>Orders Awaiting Pickup</strong> — Completed sales not yet picked up by customers.</li>
            <li><strong>Needs Reordering</strong> — Products below their reorder point. Click it to view them in inventory.</li>
            <li><strong>Active Inventory Value</strong> — Total cost value of all active stock.</li>
            <li><strong>Receivables</strong> — Outstanding customer balances from deposit transactions.</li>
            <li><strong>Revenue Month-to-Date</strong> — Net revenue for the current month.</li>
            <li><strong>Avg. Transaction Value</strong> — Mean amount per transaction.</li>
          </ul>
        </div>
      ),
    },
    {
      question: "How is the reorder point calculated, and what is its purpose?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <p>
            The reorder point (ROP) tells you the stock level at which you should place a new order
            to avoid running out.
          </p>
          <p><strong>Formula:</strong></p>
          <p className="pl-4">ROP = (Daily Sales Velocity × Lead Time in Days) + 2</p>
          <p><strong>Where:</strong></p>
          <ul className="list-disc pl-8 space-y-1">
            <li><strong>Daily Sales Velocity</strong> = total units sold in the past 30 days ÷ 30</li>
            <li><strong>Lead Time</strong> = number of days for a new order to arrive (default: 3 days)</li>
            <li><strong>+2</strong> = safety stock buffer for unexpected demand</li>
          </ul>
          <p>
            The system also applies a hybrid threshold: if the product's configured low-level threshold
            is higher than the computed ROP, the system uses the higher value instead.
          </p>
          <p><strong>Example:</strong></p>
          <ul className="list-disc pl-8 space-y-1">
            <li>A product sold 60 units in the past 30 days → velocity = 60 ÷ 30 = 2.0/day</li>
            <li>Lead time = 3 days</li>
            <li>ROP = (2.0 × 3) + 2 = <strong>8 units</strong></li>
            <li>When stock drops to 8 or below, the product is flagged for reordering.</li>
          </ul>
        </div>
      ),
    },
    {
      question: "How is the suggested quantity of product to be purchased calculated, and what is its purpose?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <p>
            The suggested order quantity tells you how many units to restock so that you have enough
            supply for the next 30 days.
          </p>
          <p><strong>Formula:</strong></p>
          <p className="pl-4">Suggested Quantity = Target Stock − Current Quantity (minimum of 0)</p>
          <p><strong>Target Stock</strong> is the higher of:</p>
          <ul className="list-disc pl-8 space-y-1">
            <li>Daily Sales Velocity × 30, rounded up (a 30-day supply), or</li>
            <li>The product's configured low-level threshold</li>
          </ul>
          <p>
            If the result is negative or zero, no reorder is suggested.
          </p>
          <p><strong>Example:</strong></p>
          <ul className="list-disc pl-8 space-y-1">
            <li>A product sold 90 units in the past 30 days → velocity = 90 ÷ 30 = 3.0/day</li>
            <li>Current stock = 5 units</li>
            <li>Target Stock = ceil(3.0 × 30) = 90</li>
            <li>Suggested Quantity = 90 − 5 = <strong>85 units</strong></li>
          </ul>
          <p>
            This suggestion appears as a reorder warning banner in the product detail view when
            stock is at or below the reorder point.
          </p>
        </div>
      ),
    },
    {
      question: "How do I adjust stock levels for a product?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Go to <strong>Inventory Management</strong>, find the product, and click the <strong>View</strong> button.</li>
            <li>In the product detail view, click the stock adjustment button.</li>
            <li>Choose <strong>Add Stock</strong> or <strong>Remove Stock</strong>.</li>
            <li>Enter the quantity and select or type a reason.</li>
          </ol>
          <p>A preview shows the resulting stock level before you confirm. All adjustments are recorded in the Audit Trail.</p>
        </div>
      ),
    },
    {
      question: "How do I reset a user's password?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Go to <strong>Registration</strong>, find the user, and click <strong>Edit</strong>.</li>
            <li>In the edit form, click <strong>Reset Password</strong>.</li>
            <li>Enter a temporary password and confirm.</li>
          </ol>
          <p>The user will be required to change their password and set a security question the next time they log in.</p>
        </div>
      ),
    },
    {
      question: "Why is a new user forced to change their password on first login?",
      answer:
        "When an administrator creates a new user account or resets a user's password, the system flags the account for a mandatory password change. This ensures that only the user knows their password and that administrators cannot access other accounts. The user must also set up a security question during this process.",
    },
    {
      question: "How do I manage product categories and suppliers?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <p>When adding or editing a product, you can manage categories and suppliers in two ways:</p>
          <ul className="space-y-1.5">
            <li><strong>Edit existing entries</strong> — Click the gear icon next to the Category or Supplier field to open a management modal. From there you can view all entries, toggle their active/inactive status, or delete ones that have no associated products.</li>
            <li><strong>Add new entries</strong> — Type a new name in the product form's combobox field and select <strong>Create</strong>.</li>
          </ul>
        </div>
      ),
    },
    {
      question: "How do I view a patient's prescription history?",
      answer:
        "Go to Patient Management, find the patient, and click the View button. The patient profile displays all prescriptions and health history records. You can add new prescriptions or edit existing ones from this view.",
    },
    {
      question: "How do I log a patient visit?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Go to <strong>Patient Management</strong>, find the patient, and click <strong>View</strong>.</li>
            <li>Click <strong>Log Visit</strong> to open the visit dialog.</li>
            <li>Select a date and time.</li>
            <li>Choose a visit purpose (such as Eye Check-up, Frame Fitting, Pick-up, or Consultation).</li>
            <li>Optionally add notes. If the patient has a pending follow-up, you can link the visit to it.</li>
          </ol>
        </div>
      ),
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
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Go to <strong>Registration</strong> and click <strong>Add User</strong>.</li>
            <li>Fill in the personal information.</li>
            <li>Set a username and password.</li>
            <li>Assign a role (Admin or Staff).</li>
            <li>Set a security question for password recovery.</li>
          </ol>
          <p>The new user will be prompted to change their password on first login.</p>
        </div>
      ),
    },
    {
      question: "How do I add or edit a product in inventory?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Go to <strong>Inventory Management</strong>.</li>
            <li>Click <strong>Add Product</strong> to create a new product, or find an existing product and click the <strong>Edit</strong> icon.</li>
            <li>Fill in or update the product details including name, category, supplier, price, cost, and stock quantity.</li>
            <li>Optionally upload a product image.</li>
          </ol>
          <p>Changes do not affect previously completed transactions.</p>
        </div>
      ),
    },
    {
      question: "How do I process a refund?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Navigate to <strong>Sales and Transactions</strong> and click on the transaction you want to refund.</li>
            <li>In the transaction detail view, click <strong>Refund Item(s)</strong> to enter selection mode.</li>
            <li>Check the items to refund and click <strong>Prepare Refund</strong>.</li>
            <li>In the refund drawer, set the <strong>quantity</strong> and <strong>reason</strong> for each item.</li>
            <li>Choose a refund method (<strong>Cash</strong> or <strong>GCash</strong>) and confirm.</li>
          </ol>
          <p>A refund receipt will be generated. Restocked quantities are automatically added back to inventory for physical items.</p>
        </div>
      ),
    },
    {
      question: "How do I use the Audit Trail?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <p>The Audit Trail is found under <strong>Maintenance</strong>. It logs all system actions including:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Login and logout activity</li>
            <li>Creating or updating records</li>
            <li>Archiving and restoring</li>
            <li>Voiding transactions</li>
            <li>Database backups</li>
          </ul>
          <p>You can filter by action type, resource type, and date range to review specific activities. Click the <strong>View</strong> button on any entry to see full details and navigate to the related record.</p>
        </div>
      ),
    },
  ];

  const staffFaqItems = [
    {
      question: "How do I process a sale in Billing and Payment?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Go to <strong>Billing and Payment</strong>.</li>
            <li>Select products from the left panel — toggle between <strong>Physical Products</strong> and <strong>Services</strong> using the tabs at the top. You can search by name and filter by category.</li>
            <li>Click the <strong>Add to Cart</strong> (plus) button for each item.</li>
            <li>Once items are in the cart, click <strong>Pay</strong> to open the payment drawer.</li>
            <li>Choose a payment method (Cash or GCash) and complete the transaction. A receipt will be generated.</li>
          </ol>
        </div>
      ),
    },
    {
      question: "How do I associate a patient with a sale?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>In the Billing and Payment page, click <strong>Associate Patient</strong> in the customer section on the right panel.</li>
            <li>Search for the patient by name, contact number, or ID.</li>
            <li>Click <strong>Select Patient</strong>.</li>
          </ol>
          <p>Linking a patient is optional for full payments but required for deposits (partial payments). You can remove the linked patient by clicking the X button.</p>
        </div>
      ),
    },
    {
      question: "How do I load a patient's prescription items into the cart?",
      answer:
        "After associating a patient with the sale, the patient section expands to show their prescriptions. Select a prescription from the dropdown and click 'Load to Cart'. The recommended products will be added automatically. Items already in the cart are skipped and will not be duplicated.",
    },
    {
      question: "How do I apply a Senior or PWD discount?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <p>In the Billing and Payment cart, check the <strong>Apply Senior / PWD Discount</strong> checkbox. You must fill in all three required fields:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Full Name (as printed on their ID)</li>
            <li>Home Address</li>
            <li>Senior/PWD ID Number</li>
          </ul>
          <p>Once all three fields are completed, eligible items will automatically receive a <strong>20% discount</strong>.</p>
          <p><strong>Note:</strong> While the Senior/PWD discount is active, manual discounts on eligible items are locked.</p>
        </div>
      ),
    },
    {
      question: "How do I apply a discount to a specific item in the cart?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>In the cart, click <strong>Add Discount</strong> below the item you want to discount.</li>
            <li>Choose the discount type — <strong>Fixed</strong> (₱) or <strong>Percent</strong> (%).</li>
            <li>Enter the value and press <strong>Enter</strong> to apply.</li>
          </ol>
          <p>Percentage discounts cannot exceed 100%, and fixed discounts cannot exceed the item subtotal. To remove a discount, click the green discount badge on the item.</p>
        </div>
      ),
    },
    {
      question: "How do I process a GCash payment?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>In the payment drawer, click the <strong>GCash</strong> button.</li>
            <li>Enter the GCash mobile number (must start with 09 and be 11 digits).</li>
            <li>Enter the reference number from the GCash transaction.</li>
            <li>Enter the amount tendered and complete the payment.</li>
          </ol>
          <p>For GCash, the amount is capped at the total — overpayment is not allowed.</p>
        </div>
      ),
    },
    {
      question: "How do I accept a deposit (partial payment)?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <p>In the payment drawer, enter an amount that is less than the total. Keep in mind the following rules:</p>
          <ul className="space-y-1.5">
            <li><strong>Minimum deposit</strong> — 50% of the grand total.</li>
            <li><strong>Patient and prescription required</strong> — Deposits require a linked patient with a linked prescription. If either is missing, you will see a warning message.</li>
            <li><strong>Payment method</strong> — GCash amounts are capped at the total, so deposits must be made with Cash.</li>
          </ul>
          <p>A deposit receipt will show the remaining balance.</p>
        </div>
      ),
    },
    {
      question: "How do I settle the remaining balance on a deposit transaction?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Navigate to <strong>Sales and Transactions</strong> and find the deposit transaction.</li>
            <li>Click <strong>View</strong>. An <strong>Add Payment</strong> button will appear for deposit transactions.</li>
            <li>Choose <strong>Cash</strong> or <strong>GCash</strong> and complete the payment.</li>
          </ol>
          <p>The remaining balance must be settled in full — partial payments are not allowed for the second payment.</p>
        </div>
      ),
    },
    {
      question: "How do I reprint a receipt?",
      answer:
        "Go to Sales and Transactions, find the transaction, and click View. In the Payment Details section, click 'Reprint Receipt' to open the original receipt for printing. You can also click 'Statement of Account' to view or print an amended statement that includes any refunds or adjustments.",
    },
    {
      question: "How do I adjust stock levels for a product?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Go to <strong>Inventory Management</strong>, find the product, and click <strong>View</strong>.</li>
            <li>In the product detail page, click <strong>Adjust Stock</strong>.</li>
            <li>Choose <strong>Add Stock</strong> or <strong>Remove Stock</strong>.</li>
            <li>Enter the quantity and select or type a reason.</li>
          </ol>
          <p>A preview shows the resulting stock level before you confirm. This is useful for recording deliveries, damaged items, or inventory corrections.</p>
        </div>
      ),
    },
    {
      question: "What do the stock status badges mean?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <p>In the Inventory Management table, each product has a stock status badge:</p>
          <ul className="space-y-1.5">
            <li><strong>Normal</strong> (green) — Stock is at a healthy level.</li>
            <li><strong>Reorder</strong> (yellow) — Stock is at or below the reorder point and needs restocking.</li>
            <li><strong>Out of Stock</strong> (red) — Quantity is zero.</li>
            <li><strong>Overstocked</strong> (yellow) — Stock exceeds the overstock threshold.</li>
            <li><strong>Service</strong> — Service-type products which have no stock tracking.</li>
          </ul>
        </div>
      ),
    },
    {
      question: "What happens to my cart if I refresh the page?",
      answer:
        "Your cart is automatically saved and will persist if you refresh the page or navigate away within the same browser session. However, if you close the browser entirely, the cart will be cleared. If an administrator archives a product while it is in your cart, it will be removed automatically with a notification.",
    },
    {
      question: "How do I look up a product in inventory?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <p>Go to <strong>Inventory Management</strong> and use the following tools to find products:</p>
          <ul className="space-y-1.5">
            <li><strong>Search bar</strong> — Find products by name.</li>
            <li><strong>Category filter</strong> — Filter products by category.</li>
            <li><strong>Sorting</strong> — Sort by name, quantity, or price.</li>
            <li><strong>Stock filter</strong> — View only products that are out of stock, need reordering, or are overstocked.</li>
          </ul>
          <p>Click the <strong>View</strong> button on any product to see its full details including stock levels, sales history, and reorder information.</p>
        </div>
      ),
    },
    {
      question: "How do I view past transactions?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <p>Go to <strong>Sales and Transactions</strong> to see a list of all completed sales. Use the following tools to find transactions:</p>
          <ul className="space-y-1.5">
            <li><strong>Search bar</strong> — Find a specific transaction number.</li>
            <li><strong>Status filter</strong> — Filter by Deposit, Paid, or Voided.</li>
            <li><strong>Date range filter</strong> — Filter transactions within a specific period.</li>
            <li><strong>Sorting</strong> — Sort by date or amount.</li>
          </ul>
          <p>Click the <strong>View</strong> button on any transaction to see its full details, payment history, and refund records.</p>
        </div>
      ),
    },
    {
      question: "What do the transaction status badges mean?",
      answer: (
        <div className="space-y-3 text-muted-foreground">
          <p>Transactions have two types of status badges:</p>
          <div>
            <p className="font-medium text-foreground">Financial Status</p>
            <ul className="mt-1 space-y-1">
              <li><strong>Paid</strong> — Full amount has been collected.</li>
              <li><strong>Deposit</strong> — Partial payment made; balance remaining.</li>
              <li><strong>Voided</strong> — Transaction has been cancelled.</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground">Fulfillment Status</p>
            <ul className="mt-1 space-y-1">
              <li><strong>Pending Lab</strong> — Order is being prepared.</li>
              <li><strong>For Pickup</strong> — Order is ready for the customer.</li>
              <li><strong>Completed</strong> — Customer has picked up the order.</li>
            </ul>
          </div>
          <p>A separate <strong>refund status</strong> shows if any items were partially or fully refunded.</p>
        </div>
      ),
    },
    {
      question: "What actions are restricted for Staff users?",
      answer: (
        <div className="space-y-2 text-muted-foreground">
          <p>As a Staff user, the following restrictions apply:</p>
          <ul className="space-y-1.5">
            <li><strong>Inaccessible modules</strong> — Dashboard, Patient Management, Registration, Maintenance, and Reports.</li>
            <li><strong>Inventory Management</strong> — You can view products and check stock, but cannot add, edit, or archive products.</li>
            <li><strong>Transactions</strong> — Processing refunds, voiding transactions, and marking fulfillment statuses (Ready for Pickup, Picked Up) are restricted to administrators.</li>
          </ul>
          <p>If you need to perform any restricted action, please ask your system administrator.</p>
        </div>
      ),
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
        (typeof item.answer === "string" && item.answer.toLowerCase().includes(q))
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
                  {typeof item.answer === "string" ? (
                    <p className="text-muted-foreground">{item.answer}</p>
                  ) : (
                    item.answer
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
