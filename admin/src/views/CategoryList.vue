<template>
  <div>
    <div class="page-header">
      <h3>分类管理</h3>
      <el-button v-if="hasPermission('category:manage')" type="primary" @click="openDialog()">新增分类</el-button>
    </div>

    <el-table :data="list" stripe v-loading="loading">
      <el-table-column prop="name" label="分类名称" />
      <el-table-column prop="sortOrder" label="排序" width="80" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isEnabled ? 'success' : 'info'">{{ row.isEnabled ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="hasPermission('category:manage')" label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" :loading="actionLoading" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="isEdit ? '编辑分类' : '新增分类'" v-model="visible" width="400px">
      <el-form :model="form" :rules="formRules">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.isEnabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import http from '@/api/http';
import { hasPermission } from '@/utils/permissions';

const list = ref<any[]>([]);
const loading = ref(false);
const visible = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const actionLoading = ref(false);
const mounted = ref(true);
onUnmounted(() => { mounted.value = false });
const form = ref({ id: 0, name: '', sortOrder: 0, isEnabled: 1 });
const formRules = { name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }] };

async function fetch() {
  loading.value = true;
  try {
    const { data } = await http.get('/categories');
    if (!mounted.value) return;
    if (data.code === 0) list.value = data.data;
  } finally {
    loading.value = false;
  }
}

function openDialog(row?: any) {
  if (row) {
    isEdit.value = true;
    form.value = { id: row.id, name: row.name, sortOrder: row.sortOrder, isEnabled: row.isEnabled };
  } else {
    isEdit.value = false;
    form.value = { id: 0, name: '', sortOrder: 0, isEnabled: 1 };
  }
  visible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    const payload = { name: form.value.name, sortOrder: form.value.sortOrder, isEnabled: form.value.isEnabled };
    let res;
    if (isEdit.value) {
      res = await http.put(`/categories/${form.value.id}`, payload);
    } else {
      res = await http.post('/categories', payload);
    }
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

async function handleDelete(row: any) {
  await ElMessageBox.confirm('确定删除该分类？', '提示', { type: 'warning' });
  const { data } = await http.delete(`/categories/${row.id}`);
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
</style>
