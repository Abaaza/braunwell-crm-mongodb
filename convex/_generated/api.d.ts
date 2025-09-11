/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as activity from "../activity.js";
import type * as analytics from "../analytics.js";
import type * as auditLogs from "../auditLogs.js";
import type * as auditRetention from "../auditRetention.js";
import type * as auditUtils from "../auditUtils.js";
import type * as auth from "../auth.js";
import type * as backup from "../backup.js";
import type * as clearData from "../clearData.js";
import type * as companySettings from "../companySettings.js";
import type * as contactCommunications from "../contactCommunications.js";
import type * as contactNotes from "../contactNotes.js";
import type * as contacts from "../contacts.js";
import type * as contacts_enhanced from "../contacts_enhanced.js";
import type * as customFields from "../customFields.js";
import type * as customMetrics from "../customMetrics.js";
import type * as dashboard from "../dashboard.js";
import type * as dashboardTemplates from "../dashboardTemplates.js";
import type * as dashboards from "../dashboards.js";
import type * as encryption from "../encryption.js";
import type * as expenses from "../expenses.js";
import type * as initTestUsers from "../initTestUsers.js";
import type * as invoices from "../invoices.js";
import type * as lib_encryption from "../lib/encryption.js";
import type * as migrations_encryptRevenue from "../migrations/encryptRevenue.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as permissions from "../permissions.js";
import type * as projectContacts from "../projectContacts.js";
import type * as projectPayments from "../projectPayments.js";
import type * as projectTemplates from "../projectTemplates.js";
import type * as projects from "../projects.js";
import type * as reportExports from "../reportExports.js";
import type * as savedReports from "../savedReports.js";
import type * as scheduledReports from "../scheduledReports.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as seedCompanySettings from "../seedCompanySettings.js";
import type * as seedExpenses from "../seedExpenses.js";
import type * as settings from "../settings.js";
import type * as taskTemplates from "../taskTemplates.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  analytics: typeof analytics;
  auditLogs: typeof auditLogs;
  auditRetention: typeof auditRetention;
  auditUtils: typeof auditUtils;
  auth: typeof auth;
  backup: typeof backup;
  clearData: typeof clearData;
  companySettings: typeof companySettings;
  contactCommunications: typeof contactCommunications;
  contactNotes: typeof contactNotes;
  contacts: typeof contacts;
  contacts_enhanced: typeof contacts_enhanced;
  customFields: typeof customFields;
  customMetrics: typeof customMetrics;
  dashboard: typeof dashboard;
  dashboardTemplates: typeof dashboardTemplates;
  dashboards: typeof dashboards;
  encryption: typeof encryption;
  expenses: typeof expenses;
  initTestUsers: typeof initTestUsers;
  invoices: typeof invoices;
  "lib/encryption": typeof lib_encryption;
  "migrations/encryptRevenue": typeof migrations_encryptRevenue;
  migrations: typeof migrations;
  notifications: typeof notifications;
  permissions: typeof permissions;
  projectContacts: typeof projectContacts;
  projectPayments: typeof projectPayments;
  projectTemplates: typeof projectTemplates;
  projects: typeof projects;
  reportExports: typeof reportExports;
  savedReports: typeof savedReports;
  scheduledReports: typeof scheduledReports;
  search: typeof search;
  seed: typeof seed;
  seedCompanySettings: typeof seedCompanySettings;
  seedExpenses: typeof seedExpenses;
  settings: typeof settings;
  taskTemplates: typeof taskTemplates;
  tasks: typeof tasks;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
