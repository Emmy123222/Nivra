#!/usr/bin/env node
// Browser-level Nivra regression suite. Run against a built, running web app:
//   BASE_URL=http://127.0.0.1:3000 npm run test:e2e

import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const outputDir = process.env.E2E_OUTPUT_DIR ?? "artifacts/e2e-test";
const screenshotDir = `${outputDir}/screenshots`;
const results = [];
const browserErrors = [];

await mkdir(screenshotDir, { recursive: true });

const check = (name, condition, detail = "") => {
  if (!condition) throw new Error(`${name}${detail ? ` — ${detail}` : ""}`);
  results.push({ name, result: "PASS", detail });
};

const base64url = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const future = String(Math.floor(Date.now() / 1000) + 86_400);
const paymentPayload = {
  version: 1,
  contractAddress: "00".repeat(32),
  merchantCommitment: "11".repeat(32),
  amount: "250000",
  tokenColor: "22".repeat(32),
  expiry: future,
  metadataHash: "33".repeat(32),
  invoiceSecret: "44".repeat(32),
  nonce: "55".repeat(32),
  merchantPayoutKey: "66".repeat(32),
  merchantEncryptionPublicKey: "77".repeat(32),
};
const invalidPaymentPayload = { ...paymentPayload, amount: "not-a-number", tokenColor: "ab" };
const receiptPayload = {
  version: 1,
  contractAddress: "00".repeat(32),
  invoiceCommitment: "11".repeat(32),
  payerReceiptSecret: "22".repeat(32),
};

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox"],
});

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
  });

  let response = await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  check("landing responds", response?.status() === 200, `HTTP ${response?.status()}`);
  check("landing hero renders", await page.getByRole("heading", { name: /Invoicing,/ }).isVisible());
  check("landing primary CTA routes to dashboard", (await page.getByRole("link", { name: "Start invoicing" }).getAttribute("href")) === "/dashboard");
  await page.screenshot({ path: `${screenshotDir}/landing-desktop.png`, fullPage: true });

  response = await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
  check("dashboard responds", response?.status() === 200, `HTTP ${response?.status()}`);
  check("dashboard marks sample records as preview", await page.getByText("Preview data", { exact: true }).isVisible());
  await page.getByText("Lace wallet is required for Midnight", { exact: true }).waitFor();
  check("missing wallet message is accurate", await page.getByText("Lace wallet is required for Midnight", { exact: true }).isVisible());
  await page.locator("select").selectOption("paid");
  check("dashboard paid filter works", (await page.locator("tbody tr").count()) === 2, `rows=${await page.locator("tbody tr").count()}`);
  await page.screenshot({ path: `${screenshotDir}/dashboard-desktop.png`, fullPage: true });

  response = await page.goto(`${baseUrl}/dashboard/create`, { waitUntil: "networkidle" });
  check("create route responds", response?.status() === 200, `HTTP ${response?.status()}`);
  check("create route blocks disconnected use", await page.getByText("Connect a wallet from the dashboard before creating an invoice.").isVisible());

  response = await page.goto(`${baseUrl}/connect`, { waitUntil: "networkidle" });
  check("connect route responds", response?.status() === 200, `HTTP ${response?.status()}`);
  await page.getByText(/Lace was not detected/).waitFor();
  check("connect route explains missing connector", await page.getByText(/Lace was not detected/).isVisible());

  response = await page.goto(`${baseUrl}/checkout`, { waitUntil: "networkidle" });
  check("empty checkout is handled", await page.getByText(/No payment link data found/).isVisible());

  await page.goto(`${baseUrl}/checkout#${base64url(paymentPayload)}`, { waitUntil: "networkidle" });
  check("valid payment fragment renders", await page.getByRole("heading", { name: "Pay invoice" }).isVisible());
  check("checkout shows exact amount", await page.getByText("250000", { exact: true }).isVisible());
  check("unverified invoice is never presented as payable", await page.getByText(/Could not confirm this invoice exists on-chain/).isVisible());
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${screenshotDir}/checkout-valid-unverified.png`, fullPage: true });

  await page.evaluate(() => { window.location.hash = "broken"; });
  await page.getByText(/This payment link is malformed/).waitFor();
  check("checkout reparses changed fragments", await page.getByText(/This payment link is malformed/).isVisible());

  await page.evaluate((token) => { window.location.hash = token; }, base64url(invalidPaymentPayload));
  await page.getByText(/Malformed payment link payload/).waitFor();
  check("checkout rejects semantic field corruption", await page.getByText(/Malformed payment link payload/).isVisible());

  await page.goto(`${baseUrl}/receipt#${base64url(receiptPayload)}`, { waitUntil: "networkidle" });
  check("valid receipt fragment waits for chain verification", await page.getByText(/Connect a wallet to verify this receipt/).isVisible());
  await page.evaluate(() => { window.location.hash = "broken"; });
  await page.getByText(/This receipt link is malformed/).waitFor();
  check("receipt reparses changed fragments", await page.getByText(/This receipt link is malformed/).isVisible());

  const asset = await context.request.get(`${baseUrl}/keys/settleInvoice.prover`);
  check("current settle prover is served", asset.status() === 200 && (await asset.body()).length > 1_000_000, `HTTP ${asset.status()}`);
  const removedAsset = await context.request.get(`${baseUrl}/keys/claimSettlement.prover`);
  check("removed circuit asset is not shipped", removedAsset.status() === 404, `HTTP ${removedAsset.status()}`);

  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("dashboard has no page-level mobile overflow", overflow <= 1, `overflow=${overflow}px`);
  await mobile.screenshot({ path: `${screenshotDir}/dashboard-mobile.png`, fullPage: true });
  await mobile.close();

  // Exercise the connector handshake independently of any real wallet account or
  // transaction approval. Transaction execution remains covered by the compiled
  // contract/SDK tests and requires the user's wallet confirmation on Preprod.
  const connectedContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await connectedContext.addInitScript(() => {
    const connectedApi = {
      getConnectionStatus: async () => ({ status: "connected", networkId: "preprod" }),
      // Deliberately omit hintUsage: released Lace variants can provide the v4
      // connected methods without this newer advisory helper.
      getShieldedAddresses: async () => ({
        shieldedAddress: "mock-shielded-address",
        // Match 1AM and the DApp Connector v4 specification: wallet keys are
        // Bech32m values rather than raw hexadecimal strings.
        shieldedCoinPublicKey: "mn_shield-cpk_preprod1mwprxkf54wsedj4mn4ntdp072lu3j8u3sdzdargsv32mlddxvfys6yu76m",
        shieldedEncryptionPublicKey: "d7d0fe19c83ee6ffe79da2caab1aac06bc378af32072409cdfc72ff18d86bbeb",
      }),
      getShieldedBalances: async () => ({ ["22".repeat(32)]: BigInt(1_000_000) }),
      getUnshieldedBalances: async () => ({}),
      getDustBalance: async () => ({ cap: BigInt(0), balance: BigInt(0) }),
      getConfiguration: async () => ({
        indexerUri: "http://127.0.0.1:9/graphql",
        indexerWsUri: "ws://127.0.0.1:9/graphql/ws",
        substrateNodeUri: "ws://127.0.0.1:9",
        networkId: "preprod",
      }),
      getProvingProvider: async (callbacks) => {
        const [verifierKey, zkir] = await Promise.all([
          callbacks.getVerifierKey("createInvoice"),
          callbacks.getZKIR("createInvoice"),
        ]);
        window.__nivraZkAssetsLoaded = verifierKey.length > 0 && zkir.length > 0;
        return {
          check: async () => [],
          prove: async () => new Uint8Array(),
        };
      },
      balanceUnsealedTransaction: async (tx) => ({ tx }),
      submitTransaction: async () => undefined,
    };
    window.midnight = {
      mock: {
        apiVersion: "4.0.1",
        rdns: "test.nivra.wallet",
        name: "Nivra E2E Wallet",
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>",
        connect: async () => connectedApi,
      },
    };
  });
  const connectedPage = await connectedContext.newPage();
  connectedPage.on("pageerror", (error) => browserErrors.push(`connected pageerror: ${error.message}`));
  connectedPage.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`connected console: ${message.text()}`);
  });
  await connectedPage.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
  await connectedPage.getByRole("banner").getByRole("button", { name: "Connect wallet" }).click();
  await connectedPage.getByText("Wallet connected", { exact: true }).waitFor();
  check("Lace-compatible connector works without hintUsage", await connectedPage.getByText("Wallet connected", { exact: true }).isVisible());
  check("browser loads compiled ZK assets", await connectedPage.evaluate(() => window.__nivraZkAssetsLoaded === true));
  check("connected merchant is offered registry deployment", await connectedPage.getByText("Finish setting up your private registry").isVisible());
  await connectedPage.getByRole("button", { name: "Set up registry" }).click();
  const setupAlert = connectedPage.getByRole("alert").filter({ hasText: "Registry setup stopped:" });
  await setupAlert.waitFor({ timeout: 15_000 });
  const setupFailure = await setupAlert.innerText();
  const setupSummary = setupFailure.slice(0, 240);
  check("registry deployment errors are shown in the UI", setupFailure.startsWith("Registry setup stopped:"), setupSummary);
  check("ledger WebAssembly initializes before deployment", !setupFailure.includes("__wbindgen"), setupSummary);
  check("1AM Bech32m payout key reaches transaction construction", !setupFailure.includes("Invalid character 'm'"), setupSummary);
  await connectedPage.getByRole("link", { name: /New invoice/ }).click();
  await connectedPage.getByRole("heading", { name: "Create invoice" }).waitFor();
  check("connected navigation opens invoice form", await connectedPage.getByRole("heading", { name: "Create invoice" }).isVisible());
  const fundedTokenOption = connectedPage.locator("option").filter({ hasText: "1000000 available" });
  await fundedTokenOption.waitFor({ state: "attached" });
  check("invoice form reads shielded wallet balances", (await fundedTokenOption.count()) === 1);
  await connectedPage.getByLabel("Amount").fill("0");
  await connectedPage.getByRole("button", { name: "Create invoice" }).click();
  await connectedPage.getByText(/Amount must be between 1 and the Uint64 maximum/).waitFor();
  check("invoice form rejects an invalid amount before deployment", await connectedPage.getByText(/Amount must be between 1 and the Uint64 maximum/).isVisible());
  await connectedPage.waitForTimeout(800);
  await connectedPage.screenshot({ path: `${screenshotDir}/create-connected-mock.png`, fullPage: true });
  await connectedContext.close();

  // Reproduce a runtime deviation observed from 1AM on a deployed HTTPS origin:
  // getConfiguration() resolves undefined even though the connector v4 type says
  // it returns Configuration. Nivra must use its selected-network endpoints and
  // complete connection instead of dereferencing undefined.networkId.
  const configlessContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await configlessContext.addInitScript(() => {
    let configurationChecked = false;
    const connectedApi = {
      hintUsage: async () => {
        throw new TypeError("Cannot read properties of undefined (reading 'networkId')");
      },
      getConnectionStatus: async () => ({ status: "connected", networkId: "preprod" }),
      getConfiguration: async () => {
        configurationChecked = true;
        return undefined;
      },
      getShieldedAddresses: async () => {
        if (!configurationChecked) {
          throw new TypeError("Cannot read properties of undefined (reading 'networkId')");
        }
        return {
          shieldedAddress: "mock-shielded-address",
          shieldedCoinPublicKey: "mn_shield-cpk_preprod1mwprxkf54wsedj4mn4ntdp072lu3j8u3sdzdargsv32mlddxvfys6yu76m",
          shieldedEncryptionPublicKey: "d7d0fe19c83ee6ffe79da2caab1aac06bc378af32072409cdfc72ff18d86bbeb",
        };
      },
      getShieldedBalances: async () => {
        throw new Error("Request failed");
      },
      getProvingProvider: async () => ({
        check: async () => [],
        prove: async () => new Uint8Array(),
      }),
      balanceUnsealedTransaction: async (tx) => ({ tx }),
      submitTransaction: async () => undefined,
    };
    window.midnight = {
      mock: {
        apiVersion: "4.0.1",
        rdns: "test.nivra.configless-wallet",
        name: "Configless E2E Wallet",
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>",
        connect: async () => connectedApi,
      },
    };
  });
  const configlessPage = await configlessContext.newPage();
  configlessPage.on("pageerror", (error) => browserErrors.push(`configless pageerror: ${error.message}`));
  await configlessPage.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
  await configlessPage.getByRole("banner").getByRole("button", { name: "Connect wallet" }).click();
  await configlessPage.getByText("Wallet connected", { exact: true }).waitFor();
  check("hosted 1AM connection tolerates missing wallet configuration", await configlessPage.getByText("Wallet connected", { exact: true }).isVisible());
  check("hosted wallet RPCs are ordered and advisory hint failures do not abort connection", !(await configlessPage.getByText(/Cannot read properties of undefined/).isVisible().catch(() => false)));
  await configlessPage.getByRole("link", { name: /New invoice/ }).click();
  await configlessPage.getByText(/Wallet balance lookup is temporarily unavailable/).waitFor();
  const savedTokenColor = "e41a0d35c72ef2acb6eb4384611725b5c906a59829b3e8fb4dff3f292718ef5e";
  check("invoice form remains usable when wallet balance lookup fails", (await configlessPage.getByLabel("Settlement token").inputValue()) === savedTokenColor);
  check("wallet balance failure is shown as recoverable guidance", await configlessPage.getByRole("button", { name: "Retry wallet lookup" }).isVisible());
  check("raw wallet request error is not shown", (await configlessPage.getByText("Could not read wallet balances: Request failed").count()) === 0);
  await configlessContext.close();

  check("browser emitted no uncaught errors", browserErrors.length === 0, browserErrors.join(" | "));
  await context.close();
} finally {
  await browser.close();
}

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  passed: results.length,
  failed: 0,
  browserErrors,
  results,
};
await writeFile(`${outputDir}/browser-report.json`, `${JSON.stringify(report, null, 2)}\n`);
for (const result of results) console.log(`PASS  ${result.name}${result.detail ? ` (${result.detail})` : ""}`);
console.log(`\n${results.length} browser checks passed; report: ${outputDir}/browser-report.json`);
