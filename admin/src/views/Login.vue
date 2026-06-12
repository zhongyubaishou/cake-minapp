<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
      <div class="bg-rect bg-rect-1"></div>
      <div class="bg-rect bg-rect-2"></div>
    </div>

    <div class="login-container">
      <div class="login-header">
        <div class="login-brand-mark">B</div>
        <h1 class="login-brand">Birth Cake</h1>
        <p class="login-desc">定制蛋糕 · 后台管理系统</p>
      </div>

      <el-card class="login-card" shadow="always">
        <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入账号"
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              show-password
              :prefix-icon="Lock"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              native-type="submit"
              class="login-btn"
            >
              登 录
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <p class="login-footer-text">蛋糕定制后台管理 · v2.0</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { User, Lock } from '@element-plus/icons-vue';
import http from '@/api/http';
import { ElMessage } from 'element-plus';

const router = useRouter();
const loading = ref(false);
const mounted = ref(true);
onUnmounted(() => { mounted.value = false });
const form = reactive({ username: '', password: '' });
const formRef = ref();
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function handleLogin() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  loading.value = true;
  try {
    const { data } = await http.post('/login', form);
    if (!mounted.value) return;
    if (data.code === 0) {
      localStorage.setItem('admin_token', data.data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.data.adminUser));
      localStorage.setItem('admin_permissions', JSON.stringify(data.data.permissions || []));
      localStorage.setItem('admin_menus', JSON.stringify(data.data.menus || []));
      ElMessage.success('登录成功');
      router.push('/');
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #F1F2F6;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.06;
}

.bg-circle-1 {
  top: -120px;
  right: -80px;
  width: 400px;
  height: 400px;
  background: var(--cake-primary);
}

.bg-circle-2 {
  bottom: -100px;
  left: -60px;
  width: 320px;
  height: 320px;
  background: var(--cake-teal);
}

.bg-circle-3 {
  top: 50%;
  left: 10%;
  width: 160px;
  height: 160px;
  background: var(--cake-purple);
  opacity: 0.04;
}

.bg-rect {
  position: absolute;
  border-radius: 20px;
  opacity: 0.05;
}

.bg-rect-1 {
  top: 15%;
  right: 15%;
  width: 80px;
  height: 80px;
  background: var(--cake-amber);
  transform: rotate(15deg);
}

.bg-rect-2 {
  bottom: 20%;
  right: 25%;
  width: 60px;
  height: 60px;
  background: var(--cake-primary);
  transform: rotate(-10deg);
}

.login-container {
  position: relative;
  z-index: 1;
  width: 420px;
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.login-brand-mark {
  display: inline-grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--cake-primary) 0%, #C0392B 100%);
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 900;
  color: #fff;
  box-shadow: 0 8px 28px rgba(232, 72, 85, 0.32);
  margin-bottom: 16px;
}

.login-brand {
  margin: 0;
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 900;
  color: var(--cake-text);
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.login-desc {
  margin: 8px 0 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--cake-muted);
  letter-spacing: 0.02em;
}

.login-card {
  border-radius: var(--radius-lg);
  border: 1px solid var(--cake-border);
}

.login-card :deep(.el-card__body) {
  padding: 32px 28px;
}

.login-card :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-card :deep(.el-input__wrapper) {
  border-radius: var(--radius-md);
  padding: 4px 14px;
  box-shadow: 0 0 0 1px var(--cake-border) inset;
}

.login-card :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--cake-muted) inset;
}

.login-card :deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--cake-primary) inset, 0 0 0 3px var(--cake-primary-glow);
}

.login-btn {
  width: 100%;
  height: 46px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.15em;
  border-radius: var(--radius-md);
  margin-top: 4px;
}

.login-footer-text {
  text-align: center;
  margin-top: 20px;
  font-size: 12px;
  color: var(--cake-placeholder);
  letter-spacing: 0.03em;
}
</style>
