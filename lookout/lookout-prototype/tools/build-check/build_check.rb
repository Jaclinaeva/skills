# Build check: reads a built page the way prototype.mjs reads a prototype state, for compare.mjs.
# Copy into a throwaway spec folder (spec/features/tmp_build_check/) and require it from a throwaway spec. Never commit.
#
#   BuildCheck.capture(page, "jobs:search")   # after visiting the page in the state to compare
#
# While loaded, it marks every ViewComponent's root element with data-component, like the prototype kit does,
# and turns on Rails' template annotations, so markup can be traced to the view or component that wrote it.
module BuildCheck
  TOOL = File.expand_path(ENV.fetch("BUILD_CHECK_TOOL"))
  OUT = File.expand_path(ENV.fetch("BUILD_CHECK_OUT"))

  # Templates compile on first render, so this must be set before any page is visited.
  ActionView::Base.annotate_rendered_view_with_filenames = true

  module Stamp
    def render_in(...)
      html = super
      name = self.class.name
      return html if name.nil? || html.blank?

      stamped = html.to_str.sub(/\A(\s*(?:<!--.*?-->\s*)*<[a-zA-Z][\w:-]*)([^>]*)>/m) do
        tag, attrs = Regexp.last_match(1), Regexp.last_match(2)
        if (inner = attrs[/\sdata-component="([^"]*)"/, 1])
          "#{tag}#{attrs.sub(/\sdata-component="[^"]*"/, %( data-component="#{name}" data-inner="#{inner}"))}>"
        else
          %(#{tag} data-component="#{name}"#{attrs}>)
        end
      end
      stamped.html_safe
    end
  end
  ViewComponent::Base.prepend(Stamp)

  def self.capture(page, state)
    browser = page.driver.browser
    browser.manage.timeouts.script_timeout = 60
    # Injected through WebDriver rather than a script tag, so the app's content security policy doesn't block it.
    page.execute_script(File.read(File.join(TOOL, "vendor/axe.min.js"))) unless page.evaluate_script("!!window.axe")
    page.execute_script(File.read(File.join(TOOL, "outline.js")))
    json = page.evaluate_async_script(<<~JS)
      var done = arguments[arguments.length - 1];
      window.__buildCheck().then(function (r) { done(JSON.stringify(r)); }, function (e) { done(JSON.stringify({ error: String(e) })); });
    JS
    data = JSON.parse(json).merge("state" => state)
    dir = File.join(OUT, "build")
    FileUtils.mkdir_p(dir)
    File.write(File.join(dir, "#{state.gsub(/[^\w-]+/, "-")}.json"), JSON.pretty_generate(data))
    data
  end
end
