# Styling checks for Lookbook previews. Copy into spec/features/tmp_lookbook/ next to the throwaway spec, set
# PREVIEW_CHECK_DIR to this skill's scripts folder, and call after visiting each example:
#
#   PreviewCheck.run(page, "01 Default")
#
# It checks the example at the current window size and again at phone width (360px), then appends the findings to
# tmp/preview-check.json. It never fails the spec: findings are for the summary, not a gate.
module PreviewCheck
  DIR = File.expand_path(ENV.fetch("PREVIEW_CHECK_DIR"))
  OUT = Rails.root.join("tmp", "preview-check.json")
  NARROW = 360

  def self.run(page, label)
    browser = page.driver.browser
    browser.manage.timeouts.script_timeout = 60
    # Injected through WebDriver rather than a script tag, so the app's content security policy doesn't block it.
    page.execute_script(File.read(File.join(DIR, "vendor", "axe.min.js"))) unless page.evaluate_script("!!window.axe")
    page.execute_script(File.read(File.join(DIR, "preview_check.js")))

    result = check(page, layout_only: false)
    browser.execute_cdp("Emulation.setDeviceMetricsOverride", width: NARROW, height: 800, deviceScaleFactor: 1, mobile: false)
    begin
      narrow = check(page, layout_only: true)
    ensure
      browser.execute_cdp("Emulation.clearDeviceMetricsOverride")
    end
    result["narrow"] = narrow

    all = File.exist?(OUT) ? JSON.parse(File.read(OUT)) : {}
    all[label] = result.merge("url" => page.current_url)
    File.write(OUT, JSON.pretty_generate(all))
    result
  end

  def self.check(page, layout_only:)
    json = page.evaluate_async_script(<<~JS)
      var done = arguments[arguments.length - 1];
      window.__previewCheck({ layoutOnly: #{layout_only} }).then(function (r) { done(JSON.stringify(r)); }, function (e) { done(JSON.stringify({ error: String(e) })); });
    JS
    JSON.parse(json)
  end
end
