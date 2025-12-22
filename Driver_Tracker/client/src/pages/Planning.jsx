import PageShell from "../lib/PageShell";
import DetailedView from "../components/DetailedView";

const Planning = () => {
  return (
    <PageShell title="Planning Overview">
      <DetailedView
        summary={<p>Planning Summary Placeholder</p>}
        leftPanel={<p>Planning Left Panel Placeholder</p>}
        rightPanel={<p>Planning Right Panel Placeholder</p>}
      ></DetailedView>
    </PageShell>
  );
};

export default Planning;
