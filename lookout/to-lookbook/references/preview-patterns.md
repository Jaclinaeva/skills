# Preview patterns

How Lookout writes ViewComponent previews for Lookbook, with examples from the
repo. Paths are relative to the Lookout repo root.

## Where things go

| What | Where |
|---|---|
| Preview class | `spec/components/previews/<namespace>/<name>_component_preview.rb` |
| Templates for its examples | `spec/components/previews/<namespace>/<name>_component_preview/<example>.html.erb` |
| Layout or pattern | `spec/components/previews/<namespace>/<name>_layout_preview.rb` (or `_pattern_preview.rb`), with a template folder |
| Written docs page | `spec/components/previews/docs/<section>/<page>.md.erb` |

The namespace mirrors the component's, wherever the component lives:
`Admin::Tickets::SnoozeFormComponent` in `app/mounts/admin/components/` still
gets its preview in `spec/components/previews/admin/tickets/`.

Previews render with a layout matching their app:
`layout "admin/component_preview"` or `layout "care/component_preview"`.
Supplier portal (`Vendor::`) previews sit in `spec/components/previews/vendor/`;
copy the layout line from a preview already there.

## A simple component: one method per example

`spec/components/previews/admin/callout_component_preview.rb`:

```ruby
module Admin
  class CalloutComponentPreview < ViewComponent::Preview
    layout "admin/component_preview"

  # @!group Variants

    def info
      render(Admin::CalloutComponent.new(variant: :info)) do
        "This is something worth calling out."
      end
    end

    def warning
      render(Admin::CalloutComponent.new(variant: :warning)) do
        "Oh no! Something potentially bad has happened."
      end
    end
  end
end
```

- `# @!group Name` groups the examples that follow in Lookbook's nav.
  Close it with `# @!endgroup` when other examples follow outside the group.
- `# @label Primary` above a method gives it a readable name in the nav.
- The example's URL is the method name:
  `/rails/view_components/admin/callout_component/info`.

## A playground: params Lookbook can change

`spec/components/previews/admin/button_component_preview.rb`:

```ruby
  # Button playground
  # -----------------------
  # You can use the controls in the 'Params' section
  # to set button property values on the fly.
  #
  # @param text
  # @param variant [Symbol] select [primary, secondary, destructive]

    def playground(text: "Hello there!", variant: :primary)
      render Admin::ButtonComponent.new(variant: variant) do
        text
      end
    end
```

Take the `select` options from the component's own list of variants (usually
a constant or a `case` in the `.rb`), never from memory. The comment block
above the method shows in Lookbook's Notes panel; it's also where a proposed
component says so (see below).

## Slots or several components: a template

When an example fills slots, or shows several instances side by side, leave
the method empty and put the markup in a template named after it.

`spec/components/previews/admin/metric_component_preview.rb`:

```ruby
module Admin
  class MetricComponentPreview < ViewComponent::Preview
    layout "admin/component_preview"

    def default
    end
  end
end
```

`spec/components/previews/admin/metric_component_preview/default.html.erb`
renders the component with its slots (`metric.with_label { … }`).

## A layout or pattern

`spec/components/previews/admin/page_layout_preview.rb` is a class with an
empty method per layout, and
`admin/page_layout_preview/tabbed_header.html.erb` composes
`Admin::Layout::WithHeaderComponent`, `Admin::TabbedHeaderComponent` and
`Admin::BreadcrumbHeaderComponent`.

For a page template, compose it from the components the real view renders,
in the same order, with the same props. Read the real view
(`app/mounts/*/views/...`) and copy its structure, not its data access: the
preview passes plain values where the view reads records.

## Copy and data in previews

Some older previews use `FFaker::Lorem` and `.titleize`, or placeholder copy
with emoji. Don't copy that. Lorem hides how real copy wraps, and
`.titleize` gives title case, which Lookout doesn't use. Write fixed, realistic
copy in sentence case, with made-up Australian names from the prototype kit's
`references/sample-data.md`. Fixed values also keep screenshots stable from one
run to the next.

## A proposed component

When the component is new (a `proposed:` component from a prototype), say so
in the preview's notes, so nobody mistakes it for an agreed part of the
system:

```ruby
module Admin
  # Proposed in the repeating jobs prototype, not yet reviewed by engineering.
  # Shows each repeating series on a purchase order: next date, how far it's
  # booked ahead and what's booked ahead.
  class RepeatingLinesComponentPreview < ViewComponent::Preview
    layout "admin/component_preview"
    # …
  end
end
```

## A docs page

`spec/components/previews/docs/branding/colour.md.erb` starts with front
matter:

```erb
---
title: Colours
label: Colours
---
```

Pages are an experimental Lookbook feature, switched on in
`config/initializers/lookbook.rb` (`page_paths`). Add one only when the
designer wants written guidance beside the examples.
