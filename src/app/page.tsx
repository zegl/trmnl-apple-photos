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

          <div className="text--black" style={{ marginTop: '20px' }}>
            Like this plugin? Please consider{' '}
            <a
              style={{ textDecoration: 'underline' }}
              href="https://buy.polar.sh/polar_cl_I7pc5Mh2nCfQk3cyLow5mxm6qg0ncpb3Ru8bu0qRKzy"
            >
              donating
            </a>{' '}
            to support it's development. 🖤
          </div>

          <div className="text--black" style={{ marginTop: '20px' }}>
            Bugs?{' '}
            <a
              style={{ textDecoration: 'underline' }}
              href="https://github.com/zegl/trmnl-apple-photos"
            >
              Open an issue on GitHub
            </a>
          </div>
        </div>

        <div className="title_bar">
          <span className="title">Apple Photos</span>
        </div>
      </div>
    </div>
  );
}
