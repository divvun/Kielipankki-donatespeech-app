package no.uit.divvun.donate_your_speech

import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.webkit.WebView
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    WindowCompat.setDecorFitsSystemWindows(window, false)
    super.onCreate(savedInstanceState)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
      WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars = true
    }
  }

  override fun onWebViewCreate(webView: WebView) {
    webView.setBackgroundColor(Color.WHITE)

    val density = resources.displayMetrics.density
    val insetTop = (readInsetPx(WindowInsetsCompat.Type.statusBars(), "status_bar_height", top = true) / density).toInt()
    val insetBottom = (readInsetPx(WindowInsetsCompat.Type.navigationBars(), "navigation_bar_height", top = false) / density).toInt()

    if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
      WebViewCompat.addDocumentStartJavaScript(
        webView,
        "document.documentElement.style.setProperty('--inset-top','${insetTop}px');" +
        "document.documentElement.style.setProperty('--inset-bottom','${insetBottom}px');",
        setOf("*")
      )
    }

    ViewCompat.setOnApplyWindowInsetsListener(window.decorView) { _, windowInsets ->
      val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
      val top = (insets.top / density).toInt()
      val bottom = (insets.bottom / density).toInt()
      webView.evaluateJavascript(
        "document.documentElement.style.setProperty('--inset-top','${top}px');" +
        "document.documentElement.style.setProperty('--inset-bottom','${bottom}px');",
        null
      )
      windowInsets
    }
    ViewCompat.requestApplyInsets(window.decorView)
  }

  private fun readInsetPx(type: Int, resourceName: String, top: Boolean): Int {
    ViewCompat.getRootWindowInsets(window.decorView)?.getInsets(type)?.let { ins ->
      val h = if (top) ins.top else ins.bottom
      if (h > 0) return h
    }
    val id = resources.getIdentifier(resourceName, "dimen", "android")
    return if (id > 0) resources.getDimensionPixelSize(id) else 0
  }
}
