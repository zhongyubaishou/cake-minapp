<template>
  <el-container class="layout">
    <el-aside width="240px" class="sidebar">
      <div class="brand">
        <div class="brand-mark">
          <span class="brand-initial">B</span>
          <div class="brand-geo brand-geo-1"></div>
          <div class="brand-geo brand-geo-2"></div>
        </div>
        <div class="brand-text">
          <div class="brand-title">Birth Cake</div>
          <div class="brand-subtitle">定制蛋糕管理台</div>
        </div>
      </div>

      <div class="sidebar-divider"></div>

      <el-menu
        :default-active="activeMenu"
        router
        class="side-menu"
        background-color="transparent"
        text-color="#8A8DA6"
        active-text-color="#ffffff"
      >
        <el-menu-item v-for="m in menus" :key="m.path" :index="m.path">
          <span class="menu-label">{{ m.label }}</span>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <div class="sidebar-deco-circle"></div>
        <div class="sidebar-deco-circle"></div>
        <div class="sidebar-deco-circle"></div>
      </div>
    </el-aside>

    <el-container class="workspace">
      <el-header class="topbar">
        <div class="topbar-left">
          <div class="topbar-title">门店运营后台</div>
          <div class="topbar-subtitle">订单 · 配送 · 售后 · 案例</div>
        </div>
        <div class="topbar-right">
          <div class="user-box">
            <div class="user-avatar">{{ adminName.slice(0, 1) }}</div>
            <div class="user-info">
              <div class="user-name">{{ adminName }}</div>
              <div class="user-role">管理员</div>
            </div>
          </div>
          <el-button text class="logout-btn" @click="logout">退出</el-button>
        </div>
      </el-header>

      <el-main class="content">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getMenus, clearAdminAuth, type AdminMenuItem } from '@/utils/permissions';

const route = useRoute();
const router = useRouter();
const activeMenu = computed(() => route.path);

const menus = ref<AdminMenuItem[]>([]);
const adminName = ref('管理员');

onMounted(() => {
  menus.value = getMenus();
  try {
    const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
    adminName.value = user.name || '管理员';
  } catch {}
});

function logout() {
  clearAdminAuth();
  router.push('/login');
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
  background: var(--cake-bg);
}

/* ============================================================
   侧边栏 — 深色 · 孟菲斯几何装饰
   ============================================================ */

.sidebar {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px 16px;
  background: linear-gradient(180deg, #1A1A30 0%, #14142B 40%, #0F0F23 100%);
  border-right: none;
  position: relative;
  overflow: hidden;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 180px;
  height: 180px;
  border: 2px solid rgba(232, 72, 85, 0.12);
  border-radius: 50%;
  pointer-events: none;
}

.sidebar::after {
  content: '';
  position: absolute;
  bottom: 120px;
  left: -40px;
  width: 120px;
  height: 120px;
  border: 2px solid rgba(26, 188, 156, 0.1);
  border-radius: 50%;
  pointer-events: none;
}

/* 品牌区 */
.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 4px 8px 18px;
  position: relative;
  z-index: 1;
}

.brand-mark {
  position: relative;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--cake-primary) 0%, #C0392B 100%);
  box-shadow: 0 8px 24px rgba(232, 72, 85, 0.36);
}

.brand-initial {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.02em;
}

.brand-geo {
  position: absolute;
  border-radius: 3px;
}

.brand-geo-1 {
  top: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  background: var(--cake-teal);
}

.brand-geo-2 {
  bottom: -4px;
  left: -4px;
  width: 8px;
  height: 8px;
  background: var(--cake-amber);
}

.brand-text {
  min-width: 0;
}

.brand-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.brand-subtitle {
  margin-top: 3px;
  font-size: 11px;
  font-weight: 500;
  color: #6B6D8A;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.sidebar-divider {
  height: 1px;
  margin: 0 4px 12px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
  position: relative;
  z-index: 1;
}

/* 菜单 */
.side-menu {
  flex: 1;
  border-right: 0;
  position: relative;
  z-index: 1;
}

.side-menu :deep(.el-menu-item) {
  height: 44px;
  margin: 2px 0;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  padding: 0 16px;
  transition: all var(--transition-fast);
  position: relative;
}

.side-menu :deep(.el-menu-item .menu-label) {
  display: inline-block;
  transition: transform var(--transition-fast);
}

.side-menu :deep(.el-menu-item:hover .menu-label) {
  transform: translateX(4px);
}

.side-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, var(--cake-primary) 0%, #C0392B 100%);
  box-shadow: 0 4px 16px rgba(232, 72, 85, 0.32);
  font-weight: 700;
}

.side-menu :deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  border-radius: 0 2px 2px 0;
  background: #fff;
}

.side-menu :deep(.el-menu-item:not(.is-active):hover) {
  background: var(--cake-sidebar-hover);
  color: #C8CADA;
}

/* 侧边栏底部装饰 */
.sidebar-footer {
  display: flex;
  gap: 8px;
  padding: 16px 8px 4px;
  position: relative;
  z-index: 1;
}

.sidebar-deco-circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  opacity: 0.3;
}

.sidebar-deco-circle:nth-child(1) { background: var(--cake-primary); }
.sidebar-deco-circle:nth-child(2) { background: var(--cake-teal); }
.sidebar-deco-circle:nth-child(3) { background: var(--cake-amber); }

/* ============================================================
   工作区
   ============================================================ */

.workspace {
  min-width: 0;
}

/* 顶栏 */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 28px;
  background: var(--cake-surface);
  border-bottom: 1px solid var(--cake-border-light);
  box-shadow: var(--shadow-xs);
}

.topbar-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 800;
  color: var(--cake-text);
  letter-spacing: -0.02em;
}

.topbar-subtitle {
  margin-top: 2px;
  font-size: 12px;
  font-weight: 500;
  color: var(--cake-muted);
  letter-spacing: 0.02em;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: #fff;
  background: linear-gradient(135deg, var(--cake-primary) 0%, #C0392B 100%);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(232, 72, 85, 0.28);
}

.user-name {
  font-weight: 700;
  font-size: 13px;
  color: var(--cake-text);
  line-height: 1.3;
}

.user-role {
  font-size: 11px;
  color: var(--cake-muted);
  line-height: 1.3;
}

.logout-btn {
  font-size: 13px;
  font-weight: 600;
  color: var(--cake-muted);
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.logout-btn:hover {
  color: var(--cake-danger);
  background: var(--cake-danger-soft);
}

/* 内容区 */
.content {
  padding: 24px 28px;
  background: var(--cake-bg);
}

/* ============================================================
   页面过渡动画
   ============================================================ */

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity var(--transition-base), transform var(--transition-base);
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
