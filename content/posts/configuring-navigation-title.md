---
title: Configuring navigation title
summary: "One function styles your whole app's navigation bar: rounded, weighted fonts for the large title, inline title and back button that still scale with Dynamic Type."
topic: ios
series: midnight-snacks
category: UIKit
status: published
featured: true
date: 2026-10-08
read_time: 4
code_theme: night
code_filename: NavigationTitle.swift
preview_code: |
  let appearance = UINavigationBarAppearance()
  appearance.configureWithTransparentBackground()

  appearance.largeTitleTextAttributes =
      Attributes.navigationBarLargeTitleAttributes
  appearance.titleTextAttributes =
      Attributes.navigationBarTitleAttributes
---

<div class="sps-post-comparison">
<figure><img src="../assets/img/posts/navigation-title/before.png" alt="Affirmation screen before customization, with a large, left-aligned title in the default bold system font." loading="lazy"><figcaption>Before · Default title</figcaption></figure>
<figure><img src="../assets/img/posts/navigation-title/after-large.png" alt="Affirmation screen after customization, with a large, left-aligned title in a tall serif font." loading="lazy"><figcaption>After · Large title</figcaption></figure>
<figure><img src="../assets/img/posts/navigation-title/after-inline.png" alt="Affirmation screen after scrolling, with the custom serif title centered in the compact navigation bar." loading="lazy"><figcaption>After · Inline title</figcaption></figure>
</div>

## 1. Set up the appearance

Build one `UINavigationBarAppearance` with a transparent background. Give the back button the same title font in every state, set the large and inline title fonts, then apply it to the standard, compact and scroll-edge appearances.

```swift NAVIGATIONTITLE.SWIFT
private func updateNavigationTitle() {
    let appearance = UINavigationBarAppearance()
    appearance.configureWithTransparentBackground()

    let buttonAppearance = UIBarButtonItemAppearance()

    let titleAttributes = Attributes.navigationBackButtonTitleAttributes
    buttonAppearance.normal.titleTextAttributes = titleAttributes
    buttonAppearance.highlighted.titleTextAttributes = titleAttributes
    buttonAppearance.disabled.titleTextAttributes = titleAttributes
    buttonAppearance.focused.titleTextAttributes = titleAttributes

    appearance.backButtonAppearance = buttonAppearance

    appearance.largeTitleTextAttributes = Attributes.navigationBarLargeTitleAttributes
    appearance.titleTextAttributes = Attributes.navigationBarTitleAttributes

    UINavigationBar.appearance().standardAppearance = appearance
    UINavigationBar.appearance().compactAppearance = appearance
    UINavigationBar.appearance().scrollEdgeAppearance = appearance
    UINavigationBar.appearance().isTranslucent = true
}
```

## 2. Keep the fonts in one place

An `Attributes` enum holds the three text styles: black for the large title, bold for the inline title, semibold for the back button. Change a font here and it changes everywhere.

```swift ATTRIBUTES.SWIFT
enum Attributes {

    /// The text attributes to apply to the large title of the navigation bar.
    static let navigationBarLargeTitleAttributes: [NSAttributedString.Key: Any] = [.font: UIFont.preferredFont(for: .largeTitle, weight: .black, design: .rounded)]

    /// The text attributes to apply to the title of the navigation bar.
    static let navigationBarTitleAttributes: [NSAttributedString.Key: Any] = [.font: UIFont.preferredFont(for: .body, weight: .bold, design: .rounded)]

    /// The text attributes to apply to the back button title of the navigation bar.
    static let navigationBackButtonTitleAttributes: [NSAttributedString.Key: Any] = [.font: UIFont.preferredFont(for: .body, weight: .semibold, design: .rounded)]
}
```

## 3. Rounded fonts that scale

This `UIFont` helper starts from the system's preferred font for a text style, adds your weight, switches to the rounded design, and runs it through `UIFontMetrics` so it grows and shrinks with Dynamic Type.

```swift UIFONT+PREFERRED.SWIFT
extension UIFont {

    /// The styles system font.
    /// - Parameters:
    ///   - style: The style to configure the system font.
    ///   - weight: The weight to apply to the font.
    ///   - design: The design to apply to the font.
    /// - Returns: The styled font.
    static func preferredFont(for style: UIFont.TextStyle, weight: UIFont.Weight, design: UIFontDescriptor.SystemDesign = .rounded) -> UIFont {
        let defaultFont = Self.preferredFont(forTextStyle: style)
        var fontDescriptor = defaultFont.fontDescriptor

        fontDescriptor = fontDescriptor.addingAttributes([
            UIFontDescriptor.AttributeName.traits: [
                UIFontDescriptor.TraitKey.weight: weight.rawValue
            ]
        ])

        if let descriptor = fontDescriptor.withDesign(design) {
            fontDescriptor = descriptor
        }

        let metrics = UIFontMetrics(forTextStyle: style)
        return metrics.scaledFont(for: UIFont(descriptor: fontDescriptor, size: defaultFont.pointSize))
    }
}
```

<div class="sps-tip">
        <img src="../assets/img/mascot/smug.png" alt="">
        <p><b>Slepr tip:</b> If you show a Map or a video player, your custom title can snap back to the default style. Add <code class="sps-inline">.toolbar(.automatic, for: .navigationBar)</code> to that screen to keep it.</p>
      </div>
