<template>
  <div>
    <div class="page-header">
      <h3>蛋糕案例</h3>
      <el-button v-if="hasPermission('case:manage')" type="primary" @click="openDialog()">新增案例</el-button>
    </div>

    <el-form :inline="true" :model="filters">
      <el-form-item label="主题">
        <el-select v-model="filters.theme" clearable placeholder="全部" @change="fetch">
          <el-option v-for="theme in themes" :key="theme" :label="theme" :value="theme" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="filters.isShown" clearable placeholder="全部" @change="fetch">
          <el-option label="展示" value="1" />
          <el-option label="隐藏" value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="搜索">
        <el-input v-model="filters.keyword" placeholder="案例名称" clearable @clear="fetch" @keyup.enter="fetch" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetch">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="list" stripe v-loading="loading">
      <el-table-column label="图片" width="90">
        <template #default="{ row }">
          <el-image :src="row.imageUrl || '/walk.jpg'" style="width:48px;height:48px" fit="cover" />
        </template>
      </el-table-column>
      <el-table-column prop="name" label="案例名称" min-width="160" />
      <el-table-column prop="theme" label="主题" width="110" />
      <el-table-column label="参考磅数" width="100">
        <template #default="{ row }">{{ row.referencePound ?? '-' }}</template>
      </el-table-column>
      <el-table-column label="参考价格" width="100">
        <template #default="{ row }">{{ row.referencePrice ?? '-' }}</template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.isShown ? 'success' : 'info'">{{ row.isShown ? '展示' : '隐藏' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="hasPermission('case:manage')" label="操作" min-width="260" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button v-if="row.isShown" size="small" type="warning" :loading="actionLoading" @click="toggle(row.id, false)">隐藏</el-button>
          <el-button v-else size="small" type="success" :loading="actionLoading" @click="toggle(row.id, true)">展示</el-button>
          <el-button size="small" type="danger" :loading="actionLoading" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="isEdit ? '编辑案例' : '新增案例'" width="560px">
      <el-form :model="form" label-width="96px" :rules="formRules">
        <el-form-item label="案例名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="案例图片" prop="imageUrl">
          <el-input v-model="form.imageUrl" placeholder="图片链接（或使用上传按钮）" />
          <input type="file" accept="image/*" @change="upload" />
        </el-form-item>
        <el-form-item label="主题">
          <el-select v-model="form.theme" clearable placeholder="选择主题">
            <el-option v-for="theme in themes" :key="theme" :label="theme" :value="theme" />
          </el-select>
        </el-form-item>
        <el-form-item label="参考磅数">
          <el-input-number v-model="form.referencePound" :min="0" :step="0.5" />
        </el-form-item>
        <el-form-item label="参考价格">
          <el-input-number v-model="form.referencePrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="是否展示">
          <el-switch v-model="form.isShown" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import http from '@/api/http';
import { hasPermission } from '@/utils/permissions';

const themes = ['生日', '节日', '成人', '儿童', '老人'];
const list = ref<any[]>([]);
const loading = ref(false);
const visible = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const actionLoading = ref(false);
const mounted = ref(true);
onUnmounted(() => { mounted.value = false });
const filters = ref({ theme: '', isShown: '', keyword: '' });
const form = ref<any>({ id: 0, name: '', imageUrl: '', theme: '', referencePound: null, referencePrice: null, isShown: 1, sortOrder: 0 });
const formRules = {
  name: [{ required: true, message: '请输入案例名称', trigger: 'blur' }],
  imageUrl: [{ required: true, message: '请上传案例图片', trigger: 'blur' }],
};

async function fetch() {
  loading.value = true;
  try {
    const { data } = await http.get('/cases', { params: filters.value });
    if (!mounted.value) return;
    if (data.code === 0) list.value = data.data.list;
  } finally {
    loading.value = false;
  }
}

function reset() {
  filters.value = { theme: '', isShown: '', keyword: '' };
  fetch();
}

function openDialog(row?: any) {
  isEdit.value = Boolean(row);
  form.value = row
    ? { ...row }
    : { id: 0, name: '', imageUrl: '', theme: '', referencePound: null, referencePrice: null, isShown: 1, sortOrder: 0 };
  visible.value = true;
}

async function upload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('bizType', 'CASE');
  try {
    const { data } = await http.post('/upload', fd);
    if (!mounted.value) return;
    if (data.code === 0) {
      form.value.imageUrl = data.data.fileUrl;
      ElMessage.success('上传成功');
    }
  } catch {
    (e.target as HTMLInputElement).value = '';
    ElMessage.error('上传失败');
  }
}

async function save() {
  saving.value = true;
  try {
    const payload = { ...form.value };
    delete payload.id;
    const res = isEdit.value ? await http.put(`/cases/${form.value.id}`, payload) : await http.post('/cases', payload);
    if (!mounted.value) return;
    if (res.data.code === 0) {
      ElMessage.success('保存成功');
      visible.value = false;
      fetch();
    }
  } finally {
    saving.value = false;
  }
}

async function toggle(id: number, shown: boolean) {
  const { data } = await http.post(`/cases/${id}/${shown ? 'show' : 'hide'}`);
  if (!mounted.value) return;
  if (data.code === 0) {
    ElMessage.success(shown ? '已展示' : '已隐藏');
    fetch();
  }
}

async function remove(row: any) {
  await ElMessageBox.confirm('确定删除该案例？', '提示', { type: 'warning' });
  const { data } = await http.delete(`/cases/${row.id}`);
  if (data.code === 0) {
    ElMessage.success('删除成功');
    fetch();
  }
}

onMounted(fetch);
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; }
.no-image { color: #bbb; font-size: 12px; }
</style>
