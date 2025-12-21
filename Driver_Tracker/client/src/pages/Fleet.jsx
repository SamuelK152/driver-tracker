import PageShell from "../lib/PageShell";
import DetailedView from "../components/DetailedView";

const Fleet = () => {
  return (
    <PageShell title="Fleet Overview">
      <DetailedView
        summary={<p>Fleet Summary Placeholder</p>}
        leftPanel={<p>Fleet Left Panel Placeholder</p>}
        rightPanel={<p>Fleet Right Panel Placeholder</p>}
      >
        <p className="mb-4">Fleet Dashboard Content</p>
      </DetailedView>
    </PageShell>
  );
};

export default Fleet;
