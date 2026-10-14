import { useInterfaceStore } from "./interface-store";

/** Skin-specific decorative hardware: activity, never invented telemetry. */
export function AmbientInstruments() {
  const skin = useInterfaceStore((state) => state.interfaceId);
  return (
    <aside className="ambient-instruments" data-rack={skin} aria-hidden="true">
      {skin === "dj" && (
        <>
          <b className="rack-title">MIXER</b>
          {["L", "R"].map((channel) => (
            <div className="ambient-meter" key={channel}>
              <i />
              <span>{channel}</span>
            </div>
          ))}
          <div className="ambient-levels">
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} style={{ animationDelay: `${i * -0.15}s` }} />
            ))}
          </div>
          <div className="rack-faders">
            <i />
            <i />
          </div>
          <div className="ambient-patch">
            <i />
            <i />
            <i />
          </div>
        </>
      )}
      {skin === "cockpit" && (
        <>
          <b className="rack-title">FLIGHT</b>
          <div className="rack-horizon">
            <i />
            <span>— ┼ —</span>
          </div>
          <div className="ambient-compass">
            <i />
            <span>N</span>
          </div>
          <div className="rack-annunciators">
            <span>SYS</span>
            <span>COM</span>
            <span>NAV</span>
          </div>
          <div className="rack-altimeter">
            <i />
            <span>ACTIVITY</span>
          </div>
          <div className="rack-vents" />
        </>
      )}
      <small>DECORATIVE</small>
    </aside>
  );
}
