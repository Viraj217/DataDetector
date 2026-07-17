package com.datadetector.networkstats

import android.app.AppOpsManager
import android.app.usage.NetworkStats
import android.app.usage.NetworkStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.ConnectivityManager
import android.net.Uri
import android.provider.Settings
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileOutputStream

class NetworkStatsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "NetworkStatsModule"
    }

    @ReactMethod
    fun checkUsagePermission(promise: Promise) {
        try {
            val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                reactApplicationContext.packageName
            )
            val granted = mode == AppOpsManager.MODE_ALLOWED
            promise.resolve(granted)
        } catch (e: Exception) {
            promise.reject("PERMISSION_CHECK_ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestUsagePermission(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                data = Uri.parse("package:" + reactApplicationContext.packageName)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            // Fallback in case package URI deep link is not supported
            try {
                val fallbackIntent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactApplicationContext.startActivity(fallbackIntent)
                promise.resolve(null)
            } catch (ex: Exception) {
                promise.reject("PERMISSION_REQUEST_ERROR", ex.message)
            }
        }
    }

    @ReactMethod
    fun getDeviceUsage(startMs: Double, endMs: Double, networkType: Int, promise: Promise) {
        try {
            val networkStatsManager = reactApplicationContext.getSystemService(Context.NETWORK_STATS_SERVICE) as NetworkStatsManager
            
            // Map JS type to Android connectivity type
            val type = if (networkType == 0) ConnectivityManager.TYPE_MOBILE else ConnectivityManager.TYPE_WIFI
            
            // On API 34+, subscriberId is null for TYPE_MOBILE since we hold PACKAGE_USAGE_STATS
            val bucket = networkStatsManager.querySummaryForDevice(
                type,
                null,
                startMs.toLong(),
                endMs.toLong()
            )
            
            val result = Arguments.createMap().apply {
                putDouble("rxBytes", bucket.rxBytes.toDouble())
                putDouble("txBytes", bucket.txBytes.toDouble())
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("DEVICE_USAGE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getPerAppUsage(startMs: Double, endMs: Double, networkType: Int, promise: Promise) {
        try {
            val networkStatsManager = reactApplicationContext.getSystemService(Context.NETWORK_STATS_SERVICE) as NetworkStatsManager
            val type = if (networkType == 0) ConnectivityManager.TYPE_MOBILE else ConnectivityManager.TYPE_WIFI
            
            val networkStats = networkStatsManager.querySummary(
                type,
                null,
                startMs.toLong(),
                endMs.toLong()
            )
            
            val pm = reactApplicationContext.packageManager
            val usageArray = Arguments.createArray()
            
            // Temporary map to aggregate usage by UID
            val uidUsage = mutableMapOf<Int, LongArray>() // uid -> [rxBytes, txBytes]
            
            val bucket = NetworkStats.Bucket()
            while (networkStats.hasNextBucket()) {
                networkStats.getNextBucket(bucket)
                val uid = bucket.uid
                val rx = bucket.rxBytes
                val tx = bucket.txBytes
                
                val current = uidUsage.getOrPut(uid) { LongArray(2) }
                current[0] += rx
                current[1] += tx
            }
            networkStats.close()
            
            for ((uid, bytes) in uidUsage) {
                val rx = bytes[0]
                val tx = bytes[1]
                
                if (rx == 0L && tx == 0L) continue
                
                val packageName = when (uid) {
                    NetworkStats.Bucket.UID_TETHERING -> "system.tethering"
                    NetworkStats.Bucket.UID_REMOVED -> "system.removed"
                    else -> {
                        val pkgs = pm.getPackagesForUid(uid)
                        pkgs?.firstOrNull() ?: "system.uid_$uid"
                    }
                }
                
                val appUsage = Arguments.createMap().apply {
                    putInt("uid", uid)
                    putString("packageName", packageName)
                    putDouble("rxBytes", rx.toDouble())
                    putDouble("txBytes", tx.toDouble())
                }
                usageArray.pushMap(appUsage)
            }
            
            promise.resolve(usageArray)
        } catch (e: Exception) {
            promise.reject("PER_APP_USAGE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val appsList = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            val resultList = Arguments.createArray()
            
            for (appInfo in appsList) {
                // Filter out standard system services that don't have launcher intent to keep it clean,
                // but let's keep all apps that might use internet. Actually, check if the app requests INTERNET permission!
                val hasInternet = try {
                    val pkgInfo = pm.getPackageInfo(appInfo.packageName, PackageManager.GET_PERMISSIONS)
                    pkgInfo.requestedPermissions?.contains("android.permission.INTERNET") == true
                } catch (e: Exception) {
                    false
                }
                
                if (!hasInternet) continue
                
                val displayName = pm.getApplicationLabel(appInfo).toString()
                val category = getCategoryString(appInfo.category)
                val iconUri = saveAppIconToDisk(appInfo, pm)
                
                val appMap = Arguments.createMap().apply {
                    putString("packageName", appInfo.packageName)
                    putString("displayName", displayName)
                    putString("category", category)
                    putString("iconUri", iconUri ?: "")
                }
                resultList.pushMap(appMap)
            }
            promise.resolve(resultList)
        } catch (e: Exception) {
            promise.reject("GET_INSTALLED_APPS_ERROR", e.message)
        }
    }

    private fun getCategoryString(category: Int): String {
        return when (category) {
            ApplicationInfo.CATEGORY_GAME -> "game"
            ApplicationInfo.CATEGORY_AUDIO -> "audio"
            ApplicationInfo.CATEGORY_VIDEO -> "video"
            ApplicationInfo.CATEGORY_IMAGE -> "image"
            ApplicationInfo.CATEGORY_SOCIAL -> "social"
            ApplicationInfo.CATEGORY_NEWS -> "news"
            ApplicationInfo.CATEGORY_MAPS -> "maps"
            ApplicationInfo.CATEGORY_PRODUCTIVITY -> "productivity"
            else -> "other"
        }
    }

    private fun saveAppIconToDisk(appInfo: ApplicationInfo, pm: PackageManager): String? {
        return try {
            val icon = pm.getApplicationIcon(appInfo)
            val bitmap = drawableToBitmap(icon) ?: return null
            
            val iconsDir = File(reactApplicationContext.cacheDir, "app_icons")
            if (!iconsDir.exists()) {
                iconsDir.mkdirs()
            }
            val file = File(iconsDir, "${appInfo.packageName}.png")
            val out = FileOutputStream(file)
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
            out.flush()
            out.close()
            "file://" + file.absolutePath
        } catch (e: Exception) {
            null
        }
    }

    private fun drawableToBitmap(drawable: Drawable): Bitmap? {
        if (drawable is BitmapDrawable) {
            if (drawable.bitmap != null) {
                return drawable.bitmap
            }
        }
        
        val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 96
        val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 96
        
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        return bitmap
    }
}
