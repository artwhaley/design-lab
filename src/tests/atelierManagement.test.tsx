import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { atelierDesign } from "../designs/atelier";
import { atelierDefaults } from "../designs/atelier/config";
import { buildScenario } from "../fixtures";
import { resolveProductionRuntime } from "../host/productionRuntime";
import { PreviewRenderer } from "../preview/PreviewRenderer";
import { installProductionActionEmulator } from "../preview/actionApiEmulator";
import { ActionLog, FakeBackend } from "../workspaces";
import type { SurfaceKey } from "../contracts";
import { PathSimulator } from "../host/PathSimulator";

let uninstall: (() => void) | undefined;
afterEach(() => {
  uninstall?.();
  cleanup();
  vi.restoreAllMocks();
});
function setup(surface: SurfaceKey, persona: "admin" | "visitor" = "admin") {
  const backend = new FakeBackend(
    buildScenario({ persona, dataState: "populated" }),
    new ActionLog(),
    0,
  );
  const runtime = resolveProductionRuntime(
    atelierDesign,
    atelierDefaults,
    null,
  ).runtime!;
  uninstall = installProductionActionEmulator(
    backend,
    () => {},
    () => {},
  );
  const view = render(
    <PreviewRenderer
      design={atelierDesign}
      builder={backend.builder}
      backend={backend}
      runtime={runtime}
      surface={surface}
      params={{}}
      onNavigate={() => {}}
      onExternal={() => {}}
    />,
  );
  return { backend, view };
}
describe("Atelier management", () => {
  for (const surface of [
    "management.departments",
    "management.folders",
    "management.roles",
    "management.documentTypes",
    "management.people",
    "management.person",
    "management.invitations",
    "work",
  ] as SurfaceKey[]) {
    it(`renders ${surface} without deferred controls`, () => {
      setup(surface);
      expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
      expect(screen.queryByText(/connections will follow/)).toBeNull();
    });
  }
  it("creates folders through the shared hook and reports rejected writes", async () => {
    const { backend } = setup("management.folders");
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Atelier test folder" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Create folder" }).closest("form")!,
    );
    await waitFor(() =>
      expect(
        backend.builder.universe.folders.some(
          (f) => f.name === "Atelier test folder",
        ),
      ).toBe(true),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Create folder" }),
      ).not.toBeDisabled(),
    );
    backend.failNextMutation = true;
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Rejected folder" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Create folder" }).closest("form")!,
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("could not be saved"),
    );
    expect(
      backend.builder.universe.folders.some(
        (f) => f.name === "Rejected folder",
      ),
    ).toBe(false);
  });
  it("creates departments through the authorized form seam", async () => {
    const { backend } = setup("management.departments");
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Atelier department" },
    });
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Create department" })
        .closest("form")!,
    );
    await waitFor(() =>
      expect(
        backend.builder.universe.departments.some(
          (d) => d.name === "Atelier department",
        ),
      ).toBe(true),
    );
  });
  it("does not mutate when archival confirmation is cancelled", () => {
    const { backend } = setup("management.departments");
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const before = JSON.stringify(backend.builder.universe.departments);
    fireEvent.submit(
      screen.getAllByRole("button", { name: "Archive" })[0].closest("form")!,
    );
    expect(JSON.stringify(backend.builder.universe.departments)).toBe(before);
  });
  it("creates a role and exposes the shared permission grid", async () => {
    const { backend } = setup("management.roles");
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Atelier role" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Create role" }).closest("form")!,
    );
    await waitFor(() =>
      expect(
        backend.builder.universe.roles.some((r) => r.name === "Atelier role"),
      ).toBe(true),
    );
    expect(
      screen.getByRole("heading", { name: "Record Type access" }),
    ).toBeTruthy();
  });
  it("opens the full shared document type editor", () => {
    setup("management.documentTypes");
    fireEvent.click(screen.getByRole("button", { name: "New document type" }));
    expect(screen.getByRole("button", { name: "Close editor" })).toBeTruthy();
    expect(screen.getByText("Lifecycle", { exact: false })).toBeTruthy();
  });
  it("searches real fixture people", async () => {
    const { backend } = setup("management.people");
    const person = backend.builder.universe.members[0];
    fireEvent.change(screen.getByRole("combobox", { name: "Search people" }), {
      target: { value: person.name.split(" ")[0] },
    });
    await waitFor(() =>
      expect(
        screen.getByRole("listbox", { name: "People" }).children.length,
      ).toBeGreaterThan(0),
    );
  });
  it("issues an invitation through the action bridge", async () => {
    const { backend } = setup("management.invitations");
    const before = backend.builder.universe.invitations.length;
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Create invitation" })
        .closest("form")!,
    );
    await waitFor(() =>
      expect(backend.builder.universe.invitations.length).toBe(before + 1),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Copy and share",
    );
  });
  it.each([
    "management.departments",
    "management.folders",
    "management.invitations",
    "management.people",
  ] as SurfaceKey[])("hides unauthorized controls on %s", (surface) => {
    setup(surface, "visitor");
    expect(
      screen.queryByRole("button", {
        name: /^Create (department|folder|invitation)$/,
      }),
    ).toBeNull();
    if (surface === "management.people")
      expect(
        screen.queryByRole("combobox", { name: "Search people" }),
      ).toBeNull();
  });
  it("keeps canonical workspace navigation inside the parity preview", () => {
    const simulator = new PathSimulator("/design-parity", [
      "/domain/preview-domain",
    ]);
    expect(
      simulator.simulate("/domain/preview-domain/manage/people/7"),
    ).toEqual({
      kind: "surface",
      surface: "management.person",
      params: { characterId: 7 },
    });
    expect(
      simulator.simulate("/domain/another-domain/manage/people/7").kind,
    ).toBe("external");
  });
});
