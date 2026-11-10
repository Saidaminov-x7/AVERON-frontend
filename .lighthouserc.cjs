module.exports = {
  ci: {
    collect: {
      url: [process.env.LHCI_URL],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        onlyCategories: ['performance'],
        formFactor: process.env.LHCI_FORM_FACTOR ?? 'desktop',
        screenEmulation: process.env.LHCI_FORM_FACTOR === 'mobile'
          ? { mobile: true, width: 390, height: 844, deviceScaleFactor: 1, disabled: false }
          : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: process.env.LHCI_OUTPUT ?? 'artifacts/lighthouse',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%.json',
    },
  },
};
