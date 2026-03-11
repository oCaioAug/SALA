import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

test.describe("Room Reservation Flow", () => {
  let sessionToken: string;
  let testUserId: string;

  test.beforeAll(async () => {
    // Check if the test user exists (from seed)
    const user = await prisma.user.findUnique({
      where: { email: "user@sala.com" },
    });

    if (!user) {
      throw new Error(
        "Test user user@sala.com not found. Did you run the seed?"
      );
    }

    testUserId = user.id;

    // Create a valid session token for next-auth
    sessionToken = uuidv4();
    const expires = new Date();
    expires.setDate(expires.getDate() + 1); // Valid for 1 day

    await prisma.session.create({
      data: {
        sessionToken: sessionToken,
        userId: user.id,
        expires: expires,
      },
    });

    // Clean up old reservations from previous runs to avoid conflicts
    await prisma.reservation.deleteMany({
      where: {
        userId: user.id,
        purpose: "E2E Test Reservation",
      },
    });
  });

  test.afterAll(async () => {
    // Cleanup the test session and reservation
    if (sessionToken) {
      await prisma.session.deleteMany({
        where: { sessionToken },
      });
    }

    if (testUserId) {
      await prisma.reservation.deleteMany({
        where: {
          userId: testUserId,
          purpose: "E2E Test Reservation",
        },
      });
    }
  });

  test.beforeEach(async ({ context }) => {
    // Inject the session cookie into the browser context
    await context.addCookies([
      {
        name: "next-auth.session-token",
        value: sessionToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
        expires: Math.floor(Date.now() / 1000) + 86400, // 1 day in seconds
      },
    ]);
  });

  test("user can navigate to room and make a reservation", async ({ page }) => {
    // 1. Go to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/01-dashboard.png" });
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Check if room from seed is visible
    const roomTitle = page.locator('text="Laboratório de Robótica"');
    await expect(roomTitle.first()).toBeVisible({ timeout: 15000 });

    // 2. Click on the first "Ver detalhes" link (adjust text based on locale, assuming button/link exists)
    // We can locate the Card for Laboratório de Robótica and find the link inside
    const roomCard = page
      .locator(".group", { hasText: "Laboratório de Robótica" })
      .first();
    const viewDetailsLink = roomCard.locator('a[href*="/salas/"]');
    await page.screenshot({ path: "test-results/02-before-room-click.png" });
    await viewDetailsLink.click();

    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/03-room-page.png" });
    await expect(page).toHaveURL(/.*\/salas\/[^/]+/);

    // 3. Click "Ver Agendamentos" button
    // Usually buttons have distinctive features, let's locate by href or text.
    // We added "View Reservations" to support the english locale that might be the default in E2E.
    const reservationsLink = page.locator("button", {
      hasText: /(Agendamentos|View Reservations)/i,
    });
    await page.screenshot({
      path: "test-results/04-before-agendamentos-click.png",
    });
    await reservationsLink.first().click();

    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/05-agendamentos-page.png" });
    await expect(page).toHaveURL(/.*\/salas\/[^/]+\/agendamentos/);

    // 4. Click "Nova Reserva"
    const newReservationBtn = page.locator("button", {
      hasText: /Nova Reserva|New Reservation/i,
    });
    await page.screenshot({
      path: "test-results/06-before-nova-reserva-click.png",
    });
    await newReservationBtn.click();

    // 5. Fill the reservation form
    // The form is in a modal
    const modal = page
      .locator('[role="dialog"]')
      .or(page.locator(".fixed.inset-0"));
    await expect(modal.first()).toBeVisible();

    await page.screenshot({ path: "test-results/07-modal-open.png" });

    // Select user
    const userSelect = page.locator('select[name="userId"]');
    await userSelect.selectOption(testUserId);

    // Select Room (it might already be selected, but we ensure it's selected)
    // The roomId select has name="roomId"
    // Since we are creating from the room page, it should default to the room, we don't need to change it.

    // Calculate dates
    const now = new Date();
    const startDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Now + 2 hours
    const endDate = new Date(startDate.getTime() + 1 * 60 * 60 * 1000); // + 1 hour

    // Ensure double-digit formatting for datetime-local
    const pad = (n: number) => n.toString().padStart(2, "0");

    const startString = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}T${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;
    const endString = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;

    // Fill dates
    await page.locator('input[name="startTime"]').fill(startString);
    await page.locator('input[name="endTime"]').fill(endString);

    // Fill purpose
    await page.locator('textarea[name="purpose"]').fill("E2E Test Reservation");

    await page.screenshot({ path: "test-results/08-form-filled.png" });

    // 6. Submit the form
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // 7. Test it succeeds and modal closes
    await expect(page.locator('text="E2E Test Reservation"')).toBeVisible({
      timeout: 10000,
    });
    await page.screenshot({ path: "test-results/09-final.png" });
  });
});
