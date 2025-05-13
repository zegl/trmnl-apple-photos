export default function Home() {
  return (
    <div className="screen">
      <div className="view view--full">
        <div className="layout layout--col">
          <div className="text--black">
            Hello. Install this plugin from{' '}
            <a
              style={{ textDecoration: 'underline' }}
              href="https://usetrmnl.com/plugin_settings/new?keyname=apple_photos"
            >
              the TRMNL plugin page
            </a>
            .
          </div>
        </div>

        <div className="title_bar">
          <span className="title">Apple Photos</span>
        </div>
      </div>
    </div>
  );
}
