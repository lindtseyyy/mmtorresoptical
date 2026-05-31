import { useState, useMemo } from "react";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import SegmentedControl from "@/shared/components/ui/segmented-control";
import { getUserRole } from "@/shared/lib/auth";

type Tab = "manual" | "faq";

export default function HelpPage() {
  const role = getUserRole();
  const [activeTab, setActiveTab] = useState<Tab>("faq");
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());

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
        title: "System Setup",
        content: (
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold">Prerequisites</h4>
              <ul className="list-disc space-y-1 pl-6">
                <li>Java 17 or later (for the backend server)</li>
                <li>PostgreSQL 14 or later</li>
                <li>Node.js 20 or later (for building the frontend)</li>
                <li>A modern web browser (see Compatibility Guide)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Backend Setup</h4>
              <ol className="list-decimal space-y-1 pl-6">
                <li>Create a PostgreSQL database named <code className="rounded bg-muted px-1 py-0.5 text-sm">mmtorres_optical</code>.</li>
                <li>Configure database credentials in the <code className="rounded bg-muted px-1 py-0.5 text-sm">.env</code> file at the project root.</li>
                <li>Run the Spring Boot application using <code className="rounded bg-muted px-1 py-0.5 text-sm">mvn spring-boot:run</code> from the <code className="rounded bg-muted px-1 py-0.5 text-sm">backend-spring</code> directory.</li>
                <li>The server starts on port <code className="rounded bg-muted px-1 py-0.5 text-sm">8080</code> by default.</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold">Frontend Setup</h4>
              <ol className="list-decimal space-y-1 pl-6">
                <li>Navigate to the <code className="rounded bg-muted px-1 py-0.5 text-sm">frontend-react</code> directory.</li>
                <li>Run <code className="rounded bg-muted px-1 py-0.5 text-sm">npm install</code> to install dependencies.</li>
                <li>Run <code className="rounded bg-muted px-1 py-0.5 text-sm">npm run dev</code> to start the development server.</li>
                <li>Access the application at <code className="rounded bg-muted px-1 py-0.5 text-sm">http://localhost:5174</code>.</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold">Initial Admin Account</h4>
              <p className="text-muted-foreground">
                An administrator account must be created directly in the database for first-time access.
                Use the default credentials provided by your system administrator and change the password
                on first login.
              </p>
            </div>
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
                The user manual is designed for printing. Use the <em>Print Manual</em> button at the top of
                this page. For best results, enable background graphics in your browser&apos;s print settings.
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
        "The system supports two payment methods: Cash and GCash. Multiple payments can be applied to a single transaction. For GCash payments, a reference number is required. Cash payments may allow change to be given if the tendered amount exceeds the total.",
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
      question: "How do I view a patient's prescription history?",
      answer:
        "Go to Patient Management, find the patient, and click the View button. The patient profile displays all prescriptions and health history records. You can add new prescriptions or edit existing ones from this view.",
    },
    {
      question: "What happens when a product is archived?",
      answer:
        "Archiving a product hides it from the main product list and the billing and payment interface. It does not delete historical transaction data. Archived products can be restored by an administrator from Maintenance &gt; Inventory Maintenance.",
    },
    {
      question: "How do I register a new user account?",
      answer:
        "Go to Registration and click 'Add User'. Fill in the personal information, set a username and password, assign a role (Admin or Staff), and set a security question for password recovery. The new user will be prompted to change their password on first login.",
    },
    {
      question: "How do I add or edit a product in inventory?",
      answer:
        "Go to Inventory Management and click 'Add Product' to create a new product, or find an existing product and click the Edit icon. Fill in or update the product details including name, category, price, cost, and stock quantity. You can also upload a product image. Changes do not affect previously completed transactions.",
    },
    {
      question: "How do I use the Audit Trail?",
      answer:
        "The Audit Trail is found under Maintenance. It logs all system actions including login/logout, creating or updating records, archiving, voiding transactions, and database backups. You can filter by action type, resource type, and date range to review specific activities.",
    },
  ];

  const staffFaqItems = [
    {
      question: "How do I process a sale in Billing and Payment?",
      answer:
        "Go to Billing and Payment. Select products from the left panel — toggle between Physical Products and Services using the tabs at the top. Click the Add to Cart (plus) button for each item. Once items are in the cart, apply payments using cash or GCash, then complete the transaction. A receipt will be generated.",
    },
    {
      question: "How do I process a refund?",
      answer:
        "Navigate to Sales and Transactions and click on the transaction you want to refund. In the transaction detail view, click the 'Refund' button. Select the items and quantities to refund, choose the refund method (Cash or GCash), and confirm. A refund receipt will be generated.",
    },
    {
      question: "How do I look up a product in inventory?",
      answer:
        "Go to Inventory Management. Use the search bar to find products by name or ID. You can filter by category and sort by name, quantity, or price. Click the View button on any product to see its full details including stock levels and reorder information.",
    },
    {
      question: "How do I view past transactions?",
      answer:
        "Go to Sales and Transactions to see a list of all completed sales. Use the search bar to find a specific transaction number, and filter by status (Deposit, Paid, Voided) or by date range. Click the View button on any transaction to see its full details, payment history, and refund records.",
    },
    {
      question: "What actions are restricted for Staff users?",
      answer:
        "Staff users cannot access the Dashboard, Patient Management, Registration, Maintenance, or Reports modules. Within Inventory Management, staff can view products and check stock but cannot add, edit, or archive products. If you need to perform any restricted action, please ask your system administrator.",
    },
  ];

  const faqItems = useMemo(() => {
    const items = [...commonFaqItems];
    if (role === "ADMIN") items.push(...adminFaqItems);
    if (role === "STAFF") items.push(...staffFaqItems);
    return items;
  }, [role]);

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
        onChange={(value) => setActiveTab(value as Tab)}
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
          {faqItems.map((item, index) => (
            <Card key={index} className="overflow-hidden">
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
