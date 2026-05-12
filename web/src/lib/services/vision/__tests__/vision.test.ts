import { MockVisionService } from "../MockVisionService";

describe("📡 Computer Vision (MockService) Unit Tests", () => {
  let mockService: MockVisionService;

  beforeEach(() => {
    mockService = new MockVisionService();
  });

  test("Should simulate 'Empty Lab' scenario correctly", async () => {
    const base64 = "data:image/jpeg;base64,preset-empty-data";
    const result = await mockService.analyzeImage(base64);

    expect(result.provider).toBe("MOCK");
    expect(result.occupancyCount).toBe(0);
    expect(result.detectedClasses).toHaveProperty("projector", 1);
    expect(result.detectedClasses).toHaveProperty("chair", 2);
    expect(result.predictions.length).toBe(3);
  });

  test("Should simulate 'Full Classroom' occupancy scenario correctly", async () => {
    const base64 = "data:image/jpeg;base64,preset-full-classroom-data";
    const result = await mockService.analyzeImage(base64);

    expect(result.provider).toBe("MOCK");
    expect(result.occupancyCount).toBe(3); // 3 Pessoas
    expect(result.detectedClasses).toHaveProperty("person", 3);
    expect(result.detectedClasses).toHaveProperty("laptop", 3);
    expect(result.detectedClasses).toHaveProperty("projector", 1);
  });

  test("Should simulate 'Missing Equipment' audit scenario correctly", async () => {
    const base64 = "data:image/jpeg;base64,preset-missing-laptop-data";
    const result = await mockService.analyzeImage(base64);

    expect(result.provider).toBe("MOCK");
    expect(result.occupancyCount).toBe(0);
    expect(result.detectedClasses).toHaveProperty("laptop", 1); // Apenas 1 notebook detectado
    expect(result.detectedClasses).toHaveProperty("projector", 1);
  });

  test("Should simulate 'New Room Onboarding' provision scenario correctly", async () => {
    const base64 = "data:image/jpeg;base64,preset-onboarding-data";
    const result = await mockService.analyzeImage(base64);

    expect(result.provider).toBe("MOCK");
    expect(result.occupancyCount).toBe(0);
    expect(result.detectedClasses).toHaveProperty("laptop", 4); // 4 notebooks detectados
    expect(result.detectedClasses).toHaveProperty("chair", 4); // 4 cadeiras detectadas
    expect(result.detectedClasses).toHaveProperty("projector", 1);
  });

  test("Should return default dynamic mockup for arbitrary custom uploads", async () => {
    const base64 = "data:image/jpeg;base64,arbitrary-user-uploaded-file-data";
    const result = await mockService.analyzeImage(base64);

    expect(result.provider).toBe("MOCK");
    expect(result.occupancyCount).toBe(1); // 1 Pessoa default
    expect(result.detectedClasses).toHaveProperty("person", 1);
    expect(result.detectedClasses).toHaveProperty("laptop", 2);
    expect(result.detectedClasses).toHaveProperty("projector", 1);
    expect(result.detectedClasses).toHaveProperty("chair", 1);
  });
});
