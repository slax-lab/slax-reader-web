# 🌟 贡献指南

首先，感谢您考虑为我们的项目做出贡献！我们欢迎您加入我们的开源社区成为一名contributor。正是像您这样的开发者使这个项目变得更加优秀。

## 🤔 如何贡献？

### 🐞 报告Bug

如果您发现了一个bug，请开启一个issue并提供以下详细信息：

- 一个清晰描述性的issue标题
- 重现该问题的步骤描述
- 任何可能帮助我们理解问题的额外信息或截图

### 💡 提出改进建议

我们始终对新想法持开放态度！如果您有建议，请：

- 使用"Feature Request"issue模板或创建一个新issue
- 描述您想要的enhancement并解释为什么它会有用

### 🔰 您的第一次代码贡献

不确定从哪里开始？您可以通过"good first issue"标签找到适合初学者的问题。处理这些issues可以帮助您在处理更复杂的问题之前熟悉codebase。

### 🔄 Pull Request

当您准备好进行代码更改时，请创建一个Pull Request：

1. Fork仓库并将其clone到您的本地机器
2. 创建一个新branch：`git checkout -b your-branch-name`
3. 进行您的更改
4. 在本地完成必要的tests和verification后，commit更改，使用以下格式的commit message：

   ```
   emoji 简短描述

   emoji issue: #xxx (Issue Number)
   ```

   emoji必须对应以下类型：

   - ✨ (新功能)
   - 🐛 (修复bug)
   - ♻️ (重构代码)
   - ⚡ (性能优化)
   - 🔧 (基础设施/工具)
   - 🧪 (测试)
   - 📝 (文档)

5. 将更改push到您的remote branch并开始一个Pull Request
   > 我们鼓励提交小型patches，并且只接受包含单个commit的PR。

### 📜 贡献者协议

**重要说明：** 您提交的Pull Request可能会被合并或吸收到我们的商业版本中。在提交PR之前，您需要签署我们的贡献者知情同意书。

我们使用 [CLA Assistant](https://github.com/cla-assistant/cla-assistant) Bot 来管理这个过程。当您提交第一个PR时，CLA Assistant Bot会自动在PR评论中添加一个链接，引导您完成签署流程。您只需要点击链接并按照提示操作即可完成签署。此过程只需在您首次贡献时完成一次。

签署过程完成后，Bot会自动更新您的PR状态，表明您已同意我们的条款。请注意，未签署知情同意书的PR将无法被合并。

## 🎨 代码风格

我们的项目遵循以下代码规范：

1. **Domain-Driven Design (DDD)原则**

   - 将代码组织成领域模型、仓储、服务和应用层
   - 使用明确的界限上下文分隔不同的业务领域

2. **Dependency Injection**

   - 利用依赖注入来减少组件间的耦合
   - 避免使用单例和静态方法，更倾向于可测试的设计

3. **项目分层**
   - 遵循清晰的分层架构：表现层、应用层、领域层和基础设施层
   - 确保各层之间的依赖关系朝一个方向流动

请确保您的代码符合这些指导原则，使我们的代码库保持一致性和可维护性。

## 🧪 测试

确保您的更改已经过测试覆盖（如适用）。运行现有测试以确保一切按预期工作。

## 🤝 行为准则

请注意，本项目的所有参与者都应遵守我们的Code of Conduct。通过参与，您同意遵守其条款。

### ✨ 我们的承诺

为了营造一个开放和友好的环境，我们作为贡献者和维护者承诺，无论年龄、体型、残疾、种族、性别特征、性别认同和表达、经验水平、教育程度、社会经济地位、国籍、个人外表、种族、宗教或性取向如何，都确保每个人在我们的项目和社区中的参与不受骚扰。

### 📏 我们的标准

有助于创造积极环境的行为包括：

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

我们期待您的contributions！感谢您的支持！
