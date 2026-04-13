# Python + FastAPI + Flask 综合开发规范

## 前言

本文档接续之前的 Java 系列规范，专注于 **Python 3.x** 通用编码规范及 **FastAPI**、**Flask** 两大主流 Web 框架的开发最佳实践。结合 PEP 8 官方风格指南、阿里巴巴代码规约核心理念及行业最佳实践，通过正反例对照的方式，指导 AI Agent 生成高质量、高可维护、生产就绪的 Python Web 应用代码。

约束等级分为三级：**【强制】**（必须遵守）、**【推荐】**（尽量遵守）、**【参考】**（可选参考）。


## 一、Python 基础编码规范

### 1.1 命名规范

**【强制】类名使用 `UpperCamelCase`（大驼峰）；函数名、变量名、方法名使用 `snake_case`（小写+下划线）；常量使用 `UPPER_CASE`（全大写+下划线）。**

Python 社区公认的标准是 PEP 8，遵循它能让你的代码看起来像出自同一位专家之手。

**反例：**
```python
# ❌ 错误：变量用大驼峰，函数用大驼峰，常量用小写
UserName = "Alice"              # 变量不应使用大驼峰
def GetUser():                  # 函数不应使用大驼峰
    pass
max_speed = 100                 # 常量不应使用小写
```

**正例：**
```python
# ✅ 正确：遵循 PEP 8 命名规范
user_name = "Alice"             # 变量：snake_case

def get_user():                 # 函数：snake_case
    pass

MAX_SPEED = 100                 # 常量：UPPER_CASE
MAX_CONNECTION_LIMIT = 1000     # 语义完整，不嫌名字长
```

**【强制】命名严禁使用拼音与英文混合的方式，更不允许直接使用中文。**

**反例：**
```python
# ❌ 错误：拼音英文混合、中文命名
class DaZhePromotion:           # 打折促销
    pass

def get_pingfen_by_name():      # 评分
    pass

某变量 = 3                      # 中文命名
```

**正例：**
```python
# ✅ 正确：使用英文或国际通用拼音
class DiscountPromotion:
    pass

def get_rating_by_name():
    pass

# 国际通用拼音可视同英文：alibaba, taobao, hangzhou
```

**【强制】私有成员使用单下划线 `_` 开头，表示“内部使用，外部不要直接访问”；魔法方法使用双下划线 `__` 开头和结尾。**

**反例：**
```python
# ❌ 错误：私有成员未加下划线，外部随意调用
class UserService:
    def internal_cache(self):   # 本应是内部方法，却未标记
        pass
    
    def _secret_key(self):      # 单下划线开头是内部变量，但这里使用不当
        pass
```

**正例：**
```python
# ✅ 正确：遵循 Python 约定
class UserService:
    def __init__(self):                     # 魔法方法
        self._internal_cache = {}           # 私有属性
    
    def _load_from_cache(self, key):        # 私有方法
        return self._internal_cache.get(key)
    
    def get_user(self, user_id):            # 公开方法
        return self._load_from_cache(user_id)
```

**【强制】模块名应简短、全小写，可使用下划线，但不能以下划线开头或结尾。**

**反例：**
```python
# ❌ 错误
# 文件名：UserService.py
# 文件名：_utils.py
# 文件名：my-utils.py
```

**正例：**
```python
# ✅ 正确
# 文件名：user_service.py
# 文件名：utils.py
# 文件名：data_processor.py
```


### 1.2 缩进与格式规范

**【强制】必须使用 4 个空格作为一级缩进，严禁混用 Tab 和空格。**

Python 强制使用缩进来划分代码块，这是语法的灵魂。

**反例：**
```python
# ❌ 错误：混用 Tab 和空格，缩进不一致
def calculate_total(items):
    total = 0
	for item in items:      # Tab 缩进
        total += item       # 空格缩进
    return total
```

**正例：**
```python
# ✅ 正确：统一使用 4 空格缩进
def calculate_total(items):
    total = 0
    for item in items:
        total += item
    return total
```

**【推荐】建议每行代码不超过 88 字符（Black 格式化器标准）或 79 字符（PEP 8 标准）。长代码使用括号 `()` 自然换行，尽量避免使用反斜杠 `\`。**

**反例：**
```python
# ❌ 错误：超长单行 + 反斜杠换行
result = very_long_function_name(param1, param2, param3, param4) + another_long_calculation(param5) \
         + yet_another_thing(param6)   # 反斜杠不推荐
```

**正例：**
```python
# ✅ 正确：使用括号自然换行
result = (very_long_function_name(param1, param2, param3, param4)
          + another_long_calculation(param5)
          + yet_another_thing(param6))
```

**【推荐】使用自动化格式化工具（Black、Ruff）和 Linter（flake8、mypy）自动保证代码风格一致性。**

**正例配置：**
```toml
# pyproject.toml
[tool.black]
line-length = 88

[tool.ruff]
line-length = 88
select = ["E", "F", "I", "N", "W"]
```


### 1.3 类型注解规范

**【强制】函数签名必须添加类型注解，特别是公共 API 和核心业务逻辑。**

Python 3.5 引入的类型提示系统能让动态语言更可靠：通过静态类型注解提升代码可读性、重构效率与团队协作体验。

**反例：**
```python
# ❌ 错误：无类型注解，完全不可猜测参数和返回值
def process_data(data, config):
    # data 是什么结构？config 需要哪些字段？
    return result
```

**正例：**
```python
# ✅ 正确：完整类型注解
from typing import TypedDict, List, Optional

class Config(TypedDict):
    max_items: int
    strict_mode: bool

def process_data(data: dict[str, int], config: Config) -> List[str]:
    """处理数据并返回结果列表。"""
    ...
```

**【推荐】使用 `mypy` 进行静态类型检查，确保类型一致性。**

```bash
# 安装并运行 mypy
pip install mypy
mypy your_script.py
```


### 1.4 注释与文档字符串规范

**【强制】模块、类、函数必须有文档字符串（Docstring），使用三引号 `"""` 包裹，遵循 PEP 257 规范。**

**反例：**
```python
# ❌ 错误：无文档字符串
def calculate_area(radius):
    return 3.14159 * radius * 2
```

**正例：**
```python
# ✅ 正确：完整 Docstring
def calculate_area(radius: float) -> float:
    """
    计算圆的面积。
    
    Args:
        radius: 圆的半径，必须为正数。
    
    Returns:
        圆的面积。
    
    Raises:
        ValueError: 当半径为负数时抛出。
    """
    if radius < 0:
        raise ValueError("Radius cannot be negative")
    return 3.14159 * radius ** 2
```

**【强制】单行注释使用 `#`，后面必须跟一个空格；注释应说明“为什么这么做”，而不是“做了什么”。**

**反例：**
```python
# ❌ 错误：注释重复代码逻辑
age = current_year - birth_year   # 用当前年份减出生年份计算年龄
```

**正例：**
```python
# ✅ 正确：注释解释业务背景
# 根据业务规则，年龄计算采用周岁（不满一年不计）
age = current_year - birth_year
```


### 1.5 函数设计规范

**【推荐】函数应保持短小，遵循单一职责原则；避免深层嵌套，优先使用早返回（Early Return）。**

**反例：**
```python
# ❌ 错误：函数名不达意，逻辑嵌套深
def f(d):
    out = []
    for x in d:
        if x["status"] == "active":
            if x["age"] >= 18:
                out.append(x["email"].strip().lower())
    return out
```

**正例：**
```python
# ✅ 正确：清晰的函数名，早返回减少嵌套
def get_active_adult_emails(users: List[dict]) -> List[str]:
    """返回活跃且成年用户的标准化邮箱列表。"""
    emails = []
    for user in users:
        if user["status"] != "active":
            continue
        if user["age"] < 18:
            continue
        emails.append(user["email"].strip().lower())
    return emails
```


## 二、FastAPI 框架规范

### 2.1 项目结构规范

**【强制】FastAPI 项目必须采用分层架构，按功能领域而非技术类型组织模块。**

FastAPI 不强制你遵循特定的结构，但这不代表你不需要结构。合理的架构模式和最佳实践能将你的 FastAPI 项目打造成稳固、可扩展的生产级应用。

**反例：**
```
/app
├── main.py          # 2000 行代码全挤在一起
├── models.py        # 所有模型混放
├── routers.py       # 所有路由混放
└── utils.py
```

**正例（功能导向的模块化结构）：**
```
/app
├── main.py                  # 应用入口，注册路由
├── core/                    # 核心基础设施
│   ├── config.py           # 配置管理
│   ├── database.py         # 数据库连接
│   ├── security.py         # 安全认证
│   ├── dependencies.py     # 共享依赖
│   └── exceptions.py       # 自定义异常
├── users/                   # 用户功能模块（垂直拆分）
│   ├── __init__.py
│   ├── router.py           # 用户路由
│   ├── service.py          # 用户业务逻辑
│   ├── repository.py       # 用户数据访问
│   ├── schemas.py          # 用户 Pydantic 模型
│   └── models.py           # 用户 ORM 模型
├── orders/                  # 订单功能模块
│   ├── __init__.py
│   ├── router.py
│   ├── service.py
│   ├── repository.py
│   ├── schemas.py
│   └── models.py
├── api/                     # API 版本管理
│   ├── __init__.py
│   └── v1/
│       └── router.py       # v1 路由汇总
└── tests/                   # 测试目录
    ├── conftest.py
    ├── test_users/
    └── test_orders/
```

这种结构将相关功能集中存放，便于团队协作和代码维护。每个模块包含完整的 CRUD 操作链，形成独立的功能单元。


### 2.2 分层架构设计

**【强制】必须将业务逻辑、数据访问和路由处理分离，遵循以下层次划分：**

- **路由层（Routers）** ：处理 HTTP 请求与响应
- **服务层（Services）** ：实现核心业务逻辑
- **数据访问层（Repositories/DAOs）** ：与数据库交互
- **模型层（Schemas/Models）** ：定义数据结构和校验规则

这种分层设计遵循单一职责原则，每个模块只关注特定功能，降低代码耦合度。

**反例：**
```python
# ❌ 错误：路由函数中包含数据库操作和业务逻辑
@router.post("/users")
async def create_user(user_data: dict, db: Session = Depends(get_db)):
    # 业务校验写在路由中
    if len(user_data["password"]) < 6:
        raise HTTPException(400, "密码太短")
    # SQL 直接写在路由中
    db.execute("INSERT INTO users ...")
    db.commit()
    return {"message": "ok"}
```

**正例：**
```python
# ✅ 正确：分层架构
# router.py - 只做请求调度
@router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    user_service: UserService = Depends(get_user_service)
):
    """创建新用户。"""
    return await user_service.create_user(user_data)

# service.py - 业务逻辑
class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo
    
    async def create_user(self, user_data: UserCreate) -> UserResponse:
        # 业务校验
        if await self.user_repo.exists_by_email(user_data.email):
            raise BusinessException("邮箱已被注册")
        # 调用数据访问层
        user = await self.user_repo.create(user_data)
        return UserResponse.from_orm(user)

# repository.py - 数据访问
class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(self, user_data: UserCreate) -> User:
        user = User(**user_data.dict())
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
```


### 2.3 路由设计规范

**【强制】使用 `APIRouter` 进行路由拆分，每个功能模块独立管理自己的路由。**

**反例：**
```python
# ❌ 错误：所有路由堆在 main.py
app = FastAPI()

@app.get("/users")
async def get_users(): ...

@app.post("/users")
async def create_user(): ...

@app.get("/orders")
async def get_orders(): ...
```

**正例：**
```python
# ✅ 正确：使用 APIRouter 模块化
# app/users/router.py
from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/")
async def get_users(): ...

@router.post("/")
async def create_user(): ...

# app/orders/router.py
router = APIRouter(prefix="/orders", tags=["orders"])

@router.get("/")
async def get_orders(): ...

# app/main.py
from fastapi import FastAPI
from app.users.router import router as users_router
from app.orders.router import router as orders_router

app = FastAPI()
app.include_router(users_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")
```


### 2.4 依赖注入规范

**【强制】使用 FastAPI 依赖注入系统管理数据库会话、认证用户、配置等共享资源。**

FastAPI 的依赖注入系统是管理共享资源的利器，能够将依赖关系的创建与管理从业务逻辑中解耦，实现代码的高度可测试性和可维护性。

**反例：**
```python
# ❌ 错误：在路由函数内直接创建数据库连接
@router.get("/items")
async def get_items():
    db = SessionLocal()          # 手动管理连接，容易泄漏
    items = db.query(Item).all()
    db.close()
    return items
```

**正例：**
```python
# ✅ 正确：使用依赖注入管理会话生命周期
# app/core/database.py
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncSession:
    """获取数据库会话，请求结束后自动关闭。"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise

# app/users/router.py
@router.get("/items")
async def get_items(db: AsyncSession = Depends(get_db)):
    items = await db.execute(select(Item))
    return items.scalars().all()
```

**【推荐】将常用的依赖封装在 `core/dependencies.py` 中，供全局复用。**

```python
# app/core/dependencies.py
from fastapi import Depends, HTTPException, status
from app.core.database import get_db
from app.core.security import decode_token
from app.users.repository import UserRepository

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """获取当前登录用户（复用性极高的依赖）。"""
    payload = decode_token(token)
    user = await UserRepository(db).get_by_id(payload["sub"])
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "用户不存在")
    return user
```


### 2.5 配置管理规范

**【强制】使用 Pydantic `BaseSettings` 管理配置，支持环境变量覆盖和分层配置。**

**反例：**
```python
# ❌ 错误：配置硬编码或散落在各处
DATABASE_URL = "postgresql://localhost:5432/mydb"  # 硬编码
SECRET_KEY = "my-secret-key"                        # 暴露在代码中
DEBUG = True
```

**正例：**
```python
# ✅ 正确：使用 Pydantic Settings
# app/core/config.py
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    # 应用配置
    APP_NAME: str = "My FastAPI App"
    DEBUG: bool = Field(default=False, env="DEBUG")
    API_V1_STR: str = "/api/v1"
    
    # 数据库配置
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    DATABASE_POOL_SIZE: int = Field(default=20, env="DB_POOL_SIZE")
    
    # 安全配置
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
```

### 2.6 异常处理规范

**【强制】必须实现全局异常处理器，统一 API 错误响应格式。**

FastAPI 作为现代 Web 框架，提供了灵活的异常处理机制。通过合理利用这些机制，可以实现全局统一的异常捕获和自定义错误响应格式。

**反例：**
```python
# ❌ 错误：每个路由都重复编写错误处理逻辑
@router.get("/users/{user_id}")
async def get_user(user_id: int):
    try:
        user = await user_service.get_by_id(user_id)
        if not user:
            return {"error": "用户不存在"}   # 格式不统一
        return user
    except Exception as e:
        return {"error": str(e)}             # 格式不统一
```

**正例：**
```python
# ✅ 正确：全局异常处理器
# app/core/exceptions.py
class BusinessException(Exception):
    """业务异常基类。"""
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message

class ResourceNotFoundError(BusinessException):
    """资源不存在异常。"""
    def __init__(self, resource: str):
        super().__init__(404, f"{resource} 不存在")

# app/main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

@app.exception_handler(BusinessException)
async def business_exception_handler(request: Request, exc: BusinessException):
    return JSONResponse(
        status_code=exc.code if exc.code < 500 else 500,
        content={"code": exc.code, "message": exc.message, "data": None}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # 生产环境不应暴露技术细节
    return JSONResponse(
        status_code=500,
        content={"code": 500, "message": "服务器内部错误", "data": None}
    )
```


### 2.7 统一响应格式规范

**【强制】API 响应必须使用统一的 `Result` 结构。**

**反例：**
```python
# ❌ 错误：不同接口返回不同格式
@router.get("/users")
async def get_users():
    return users                    # 直接返回列表

@router.post("/users")
async def create_user():
    return {"success": True}        # 格式不一致
```

**正例：**
```python
# ✅ 正确：统一响应结构
from pydantic import BaseModel
from typing import Generic, TypeVar, Optional

T = TypeVar("T")

class Result(BaseModel, Generic[T]):
    """统一 API 响应结构。"""
    code: int = 200
    message: str = "success"
    data: Optional[T] = None
    
    @classmethod
    def success(cls, data: T = None, message: str = "success") -> "Result[T]":
        return cls(code=200, message=message, data=data)
    
    @classmethod
    def error(cls, code: int, message: str) -> "Result[None]":
        return cls(code=code, message=message, data=None)

@router.get("/users", response_model=Result[List[UserResponse]])
async def get_users():
    users = await user_service.get_all()
    return Result.success(data=users)
```


### 2.8 异步数据库操作规范

**【强制】FastAPI 异步端点必须使用异步数据库驱动（如 `asyncpg`、`aiomysql`），配合 SQLAlchemy 2.0+ 的异步扩展。**

SQLAlchemy 2.0+ 才原生支持真正的异步操作，且必须搭配异步数据库驱动。

**反例：**
```python
# ❌ 错误：在 async 端点中使用同步数据库操作（阻塞事件循环）
@router.get("/users")
async def get_users():
    db = SessionLocal()                 # 同步会话
    users = db.query(User).all()        # 阻塞操作
    db.close()
    return users
```

**正例：**
```python
# ✅ 正确：使用异步数据库操作
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select

engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost/db",
    pool_pre_ping=True,
    echo=False
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

@router.get("/users")
async def get_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    return result.scalars().all()
```


## 三、Flask 框架规范

### 3.1 项目结构规范

**【强制】Flask 项目必须根据规模选择合适的结构：小型用单文件，中型用应用工厂模式，大型用蓝图模块化。**

**反例（单文件膨胀）：**
```
/project
└── app.py  # 2000+ 行代码全挤在一起
```

**正例（中型项目 - 应用工厂模式）：**
```
medium_project/
├── app/                       # 应用核心包
│   ├── __init__.py           # 应用工厂所在地
│   ├── models.py             # 数据模型定义
│   ├── routes/               # 路由控制器
│   │   ├── __init__.py
│   │   ├── auth.py          # 认证相关路由
│   │   └── main.py          # 主要页面路由
│   ├── services/             # 业务逻辑层
│   │   ├── __init__.py
│   │   └── user_service.py
│   ├── static/               # 静态资源
│   ├── templates/            # Jinja2 模板
│   └── extensions.py         # 集中初始化 Flask 扩展
├── migrations/                # 数据库迁移脚本
├── tests/                     # 单元测试
├── config.py                  # 配置文件
├── requirements.txt           # 依赖列表
├── .env                       # 环境变量（勿提交）
└── run.py                     # 启动脚本
```

这是 Flask 最经典、最推荐的项目结构，适用于大多数 Web 应用（如博客、后台管理系统）。其核心是“应用工厂模式”，将创建 App 的逻辑独立出来。


### 3.2 应用工厂模式规范

**【强制】必须使用应用工厂模式创建 Flask 实例，支持多环境配置和扩展管理。**

**反例：**
```python
# ❌ 错误：全局创建 app，无法灵活切换配置
# app.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://..."  # 硬编码
db = SQLAlchemy(app)

@app.route("/")
def index():
    return "Hello"
```

**正例：**
```python
# ✅ 正确：应用工厂模式
# app/__init__.py
from flask import Flask
from app.extensions import db, migrate, login_manager
from config import config

def create_app(config_name: str = "development") -> Flask:
    """应用工厂函数，根据配置名创建 Flask 应用实例。"""
    app = Flask(__name__)
    
    # 加载配置
    app.config.from_object(config[config_name])
    
    # 初始化扩展
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    
    # 注册蓝图
    from app.routes.auth import auth_bp
    from app.routes.main import main_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(main_bp)
    
    return app

# app/extensions.py - 集中管理扩展，避免循环导入
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()

# run.py - 启动入口
from app import create_app

app = create_app("development")

if __name__ == "__main__":
    app.run()
```


### 3.3 蓝图模块化规范

**【强制】大型 Flask 项目必须使用蓝图（Blueprint）进行模块化拆分，按业务功能划分蓝图。**

**反例：**
```python
# ❌ 错误：不使用蓝图，路由分散且难以管理
@app.route("/users/list")
def user_list(): ...

@app.route("/users/create")
def user_create(): ...

@app.route("/orders/list")
def order_list(): ...
```

**正例：**
```python
# ✅ 正确：蓝图模块化
# app/users/__init__.py
from flask import Blueprint

users_bp = Blueprint(
    "users",
    __name__,
    url_prefix="/users",
    template_folder="templates",
    static_folder="static"
)

from app.users import views   # 导入视图

# app/users/views.py
from app.users import users_bp
from app.users.services import UserService

@users_bp.route("/")
def list_users():
    """用户列表页面。"""
    users = UserService.get_all()
    return render_template("users/list.html", users=users)

@users_bp.route("/<int:user_id>")
def user_detail(user_id):
    """用户详情页面。"""
    user = UserService.get_by_id(user_id)
    return render_template("users/detail.html", user=user)
```

**【推荐】蓝图内部也采用分层架构（MVC），将业务逻辑放在独立的 Service 层。**

```python
# app/users/services.py
class UserService:
    """用户业务逻辑层。"""
    
    @staticmethod
    def get_all() -> List[User]:
        return User.query.filter_by(is_active=True).all()
    
    @staticmethod
    def get_by_id(user_id: int) -> Optional[User]:
        return User.query.get_or_404(user_id)
    
    @staticmethod
    def create(user_data: dict) -> User:
        user = User(**user_data)
        db.session.add(user)
        db.session.commit()
        return user
```


### 3.4 配置管理规范

**【强制】Flask 配置必须使用类来组织不同环境的配置，通过环境变量切换。**

**反例：**
```python
# ❌ 错误：配置硬编码在代码中
app.config["SECRET_KEY"] = "hardcoded-secret"
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql://..."
```

**正例：**
```python
# ✅ 正确：分环境配置类
# config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """基础配置。"""
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dev-secret-key"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
class DevelopmentConfig(Config):
    """开发环境配置。"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get("DEV_DATABASE_URL")

class TestingConfig(Config):
    """测试环境配置。"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get("TEST_DATABASE_URL")

class ProductionConfig(Config):
    """生产环境配置。"""
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")

config = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig
}
```


### 3.5 请求与响应规范

**【强制】Flask 视图函数返回数据时，应使用统一的响应格式（如 `jsonify` 包装）。**

**反例：**
```python
# ❌ 错误：返回格式不统一
@users_bp.route("/api/users")
def api_users():
    return {"users": [...]}  # 直接用 dict

@users_bp.route("/api/users/<int:user_id>")
def api_user_detail(user_id):
    return jsonify(user.to_dict())  # 格式不一致
```

**正例：**
```python
# ✅ 正确：统一响应函数
from flask import jsonify

def success_response(data=None, message="success", code=200):
    """统一成功响应格式。"""
    return jsonify({
        "code": code,
        "message": message,
        "data": data
    }), code

def error_response(message, code=400):
    """统一错误响应格式。"""
    return jsonify({
        "code": code,
        "message": message,
        "data": None
    }), code

@users_bp.route("/api/users")
def api_users():
    users = UserService.get_all()
    return success_response(data=[u.to_dict() for u in users])

@users_bp.route("/api/users/<int:user_id>")
def api_user_detail(user_id):
    user = UserService.get_by_id(user_id)
    if not user:
        return error_response("用户不存在", 404)
    return success_response(data=user.to_dict())
```


## 四、Pydantic 数据校验规范

### 4.1 模型定义规范

**【强制】API 请求/响应必须使用 Pydantic 模型进行数据校验，替代手动 `isinstance()` 检查。**

Pydantic 是 Python 中最流行的数据验证库，能将类型提示转化为运行时验证规则。你只需定义一次数据结构，Pydantic 会自动处理所有验证。

**反例：**
```python
# ❌ 错误：手动校验，代码冗长且容易遗漏
def create_user(data: dict):
    if not isinstance(data.get("age"), int):
        raise ValueError("年龄必须是整数")
    if data["age"] < 0 or data["age"] > 150:
        raise ValueError("年龄必须在 0-150 之间")
    if "@" not in data.get("email", ""):
        raise ValueError("邮箱格式无效")
    # ... 更多校验
```

**正例：**
```python
# ✅ 正确：使用 Pydantic 模型
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional

class UserCreate(BaseModel):
    """用户创建请求模型。"""
    name: str = Field(..., min_length=1, max_length=50, description="用户名")
    email: EmailStr = Field(..., description="邮箱")
    age: int = Field(..., ge=0, le=150, description="年龄")
    is_active: bool = Field(default=True, description="是否激活")
    nickname: Optional[str] = Field(default=None, max_length=30)
    
    @field_validator("name")
    @classmethod
    def name_must_not_contain_special_chars(cls, v: str) -> str:
        if any(c in "!@#$%" for c in v):
            raise ValueError("用户名不能包含特殊字符")
        return v.strip()
```


### 4.2 嵌套模型与类型转换

**【推荐】利用 Pydantic 自动类型转换和嵌套模型处理复杂数据结构。**

**正例：**
```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Address(BaseModel):
    """地址嵌套模型。"""
    street: str
    city: str
    zip_code: str

class UserResponse(BaseModel):
    """用户响应模型。"""
    id: int
    name: str
    email: EmailStr
    age: int
    address: Optional[Address] = None
    created_at: datetime
    
    class Config:
        from_attributes = True  # 支持 ORM 对象转换

# 自动类型转换：字符串 "25" 自动转为整数 25
user = UserCreate(name="Alice", email="alice@example.com", age="25")
print(type(user.age))  # <class 'int'>
```


## 五、数据库操作规范（SQLAlchemy）

### 5.1 ORM 模型定义

**【强制】SQLAlchemy 模型必须定义 `__tablename__`，并添加表注释和字段注释。**

**反例：**
```python
# ❌ 错误：无表名规范、无注释
class User(Base):
    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String)
```

**正例：**
```python
# ✅ 正确：完整定义
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.extensions import db

class User(db.Model):
    """用户模型。"""
    __tablename__ = "user"
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment="用户ID")
    username = Column(String(50), nullable=False, unique=True, comment="用户名")
    email = Column(String(100), nullable=False, unique=True, comment="邮箱")
    is_active = Column(Boolean, default=True, nullable=False, comment="是否激活")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, onupdate=func.now(), comment="更新时间")
```


### 5.2 查询规范

**【强制】禁止使用字符串拼接构造 SQL 查询，必须使用参数化查询或 ORM 方法。**

**反例：**
```python
# ❌ 错误：字符串拼接，SQL 注入风险
username = request.args.get("username")
db.session.execute(f"SELECT * FROM user WHERE username = '{username}'")
```

**正例：**
```python
# ✅ 正确：参数化查询
username = request.args.get("username")
db.session.execute(
    "SELECT * FROM user WHERE username = :username",
    {"username": username}
)

# 或使用 ORM
User.query.filter(User.username == username).all()
```

**【推荐】复杂查询使用 SQLAlchemy 查询构造器，避免原生 SQL 拼接。**

**正例：**
```python
# 复杂条件查询
query = User.query
if username:
    query = query.filter(User.username.ilike(f"%{username}%"))
if email:
    query = query.filter(User.email == email)
if is_active is not None:
    query = query.filter(User.is_active == is_active)

users = query.order_by(User.created_at.desc()).limit(20).all()
```


## 六、安全规范

### 6.1 敏感信息保护

**【强制】敏感信息（密码、密钥、Token）不得硬编码在代码中，必须通过环境变量或配置服务获取。**

**反例：**
```python
# ❌ 错误：硬编码敏感信息
SECRET_KEY = "my-super-secret-key-12345"
DATABASE_URL = "postgresql://admin:password123@localhost/db"
API_TOKEN = "sk-xxxxxxxxxxxx"
```

**正例：**
```python
# ✅ 正确：从环境变量读取
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is required")

DATABASE_URL = os.environ.get("DATABASE_URL")
```

### 6.2 密码处理

**【强制】密码必须使用安全的哈希算法（如 bcrypt、argon2）存储，禁止明文存储或使用弱哈希（MD5、SHA1）。**

**反例：**
```python
# ❌ 错误：明文或弱哈希
password = request.form["password"]
user.password = password  # 明文存储
user.password = hashlib.md5(password.encode()).hexdigest()  # MD5 不安全
```

**正例：**
```python
# ✅ 正确：使用 bcrypt
import bcrypt

def hash_password(password: str) -> str:
    """使用 bcrypt 加密密码。"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, hashed: str) -> bool:
    """验证密码。"""
    return bcrypt.checkpw(password.encode(), hashed.encode())
```

### 6.3 CORS 配置

**【推荐】FastAPI/Flask 的 CORS 配置应明确指定允许的来源，禁止使用 `*` 通配符（生产环境）。**

**反例：**
```python
# ❌ 错误：生产环境允许所有来源
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 安全风险
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**正例：**
```python
# ✅ 正确：明确指定允许的来源
from fastapi.middleware.cors import CORSMiddleware

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # ["https://example.com", "https://app.example.com"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```


## 七、日志规范

**【强制】应用必须配置日志，禁止使用 `print()` 输出调试信息。**

**反例：**
```python
# ❌ 错误：使用 print 调试
def process_order(order_id):
    print(f"Processing order {order_id}")  # 生产环境无记录
    # ...
    print("Order completed")
```

**正例：**
```python
# ✅ 正确：使用 logging 模块
import logging
from logging.config import dictConfig

# logging_config.py
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        },
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(name)s %(levelname)s %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "stream": "ext://sys.stdout",
        },
    },
    "root": {
        "level": "INFO",
        "handlers": ["console"],
    },
}

dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)

def process_order(order_id):
    logger.info("Processing order", extra={"order_id": order_id})
    try:
        # 业务逻辑
        logger.info("Order completed", extra={"order_id": order_id})
    except Exception as e:
        logger.exception("Order processing failed", extra={"order_id": order_id})
        raise
```


## 八、完整正例示例

### 8.1 FastAPI + SQLAlchemy + Pydantic 完整示例

```python
# ========== app/core/config.py ==========
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    APP_NAME: str = "FastAPI Demo"
    DEBUG: bool = Field(default=False, env="DEBUG")
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# ========== app/core/database.py ==========
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

Base = declarative_base()

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncSession:
    """获取数据库会话依赖。"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise

# ========== app/users/models.py ==========
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "user"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(100), nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

# ========== app/users/schemas.py ==========
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# ========== app/users/repository.py ==========
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.users.models import User
from app.users.schemas import UserCreate

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(self, user_data: UserCreate, hashed_password: str) -> User:
        user = User(
            username=user_data.username,
            email=user_data.email,
            password_hash=hashed_password
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def get_by_id(self, user_id: int) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

# ========== app/users/service.py ==========
from app.users.repository import UserRepository
from app.users.schemas import UserCreate, UserResponse
from app.core.exceptions import BusinessException
from app.core.security import hash_password

class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo
    
    async def create_user(self, user_data: UserCreate) -> UserResponse:
        # 检查邮箱是否已存在
        existing = await self.user_repo.get_by_email(user_data.email)
        if existing:
            raise BusinessException(code=400, message="邮箱已被注册")
        
        # 创建用户
        hashed = hash_password(user_data.password)
        user = await self.user_repo.create(user_data, hashed)
        return UserResponse.model_validate(user)
    
    async def get_user(self, user_id: int) -> UserResponse:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise BusinessException(code=404, message="用户不存在")
        return UserResponse.model_validate(user)

# ========== app/users/router.py ==========
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.users.schemas import UserCreate, UserResponse
from app.users.repository import UserRepository
from app.users.service import UserService
from app.core.response import Result

router = APIRouter(prefix="/users", tags=["users"])

async def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))

@router.post("/", response_model=Result[UserResponse])
async def create_user(
    user_data: UserCreate,
    user_service: UserService = Depends(get_user_service)
):
    """创建新用户。"""
    user = await user_service.create_user(user_data)
    return Result.success(data=user, message="用户创建成功")

@router.get("/{user_id}", response_model=Result[UserResponse])
async def get_user(
    user_id: int,
    user_service: UserService = Depends(get_user_service)
):
    """获取用户详情。"""
    user = await user_service.get_user(user_id)
    return Result.success(data=user)
```

### 8.2 Flask + SQLAlchemy + 蓝图完整示例

```python
# ========== config.py ==========
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dev-secret"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get("DEV_DATABASE_URL")

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")

config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig
}

# ========== app/extensions.py ==========
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()

# ========== app/__init__.py ==========
from flask import Flask
from app.extensions import db, migrate
from config import config

def create_app(config_name: str = "development") -> Flask:
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    db.init_app(app)
    migrate.init_app(app, db)
    
    from app.users import users_bp
    from app.main import main_bp
    
    app.register_blueprint(users_bp, url_prefix="/users")
    app.register_blueprint(main_bp)
    
    return app

# ========== app/users/__init__.py ==========
from flask import Blueprint

users_bp = Blueprint(
    "users",
    __name__,
    url_prefix="/users",
    template_folder="templates"
)

from app.users import views

# ========== app/users/models.py ==========
from app.extensions import db
from datetime import datetime

class User(db.Model):
    __tablename__ = "user"
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    email = db.Column(db.String(100), nullable=False, unique=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat()
        }

# ========== app/users/services.py ==========
from app.extensions import db
from app.users.models import User
from typing import Optional, List

class UserService:
    @staticmethod
    def get_all() -> List[User]:
        return User.query.filter_by(is_active=True).all()
    
    @staticmethod
    def get_by_id(user_id: int) -> Optional[User]:
        return User.query.get(user_id)
    
    @staticmethod
    def create(username: str, email: str, password: str) -> User:
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user

# ========== app/users/views.py ==========
from flask import request, jsonify, render_template
from app.users import users_bp
from app.users.services import UserService

def success_response(data=None, message="success"):
    return jsonify({"code": 200, "message": message, "data": data})

def error_response(message, code=400):
    return jsonify({"code": code, "message": message, "data": None}), code

@users_bp.route("/api/users", methods=["GET"])
def api_get_users():
    users = UserService.get_all()
    return success_response(data=[u.to_dict() for u in users])

@users_bp.route("/api/users/<int:user_id>", methods=["GET"])
def api_get_user(user_id):
    user = UserService.get_by_id(user_id)
    if not user:
        return error_response("用户不存在", 404)
    return success_response(data=user.to_dict())
```


## 九、快速检查清单

### Python 基础
- [ ] 类名是否使用 `UpperCamelCase`？
- [ ] 函数名、变量名是否使用 `snake_case`？
- [ ] 常量是否使用 `UPPER_CASE`？
- [ ] 是否使用 4 空格缩进，禁用了 Tab？
- [ ] 函数是否添加了类型注解？
- [ ] 模块/类/函数是否有 Docstring？
- [ ] 是否运行了 `black` 或 `ruff` 格式化？

### FastAPI
- [ ] 项目是否按功能模块组织（而非技术类型）？
- [ ] 是否使用了 `APIRouter` 进行路由拆分？
- [ ] 是否使用依赖注入管理数据库会话？
- [ ] 配置是否使用 Pydantic `BaseSettings`？
- [ ] 是否实现了全局异常处理器？
- [ ] API 响应是否使用统一的 `Result` 结构？
- [ ] 异步端点是否使用了异步数据库驱动？

### Flask
- [ ] 是否使用应用工厂模式创建 App？
- [ ] 大型项目是否使用蓝图进行模块化拆分？
- [ ] 配置是否按环境分离（开发/测试/生产）？
- [ ] 敏感信息是否从环境变量读取？
- [ ] 业务逻辑是否抽离到 Service 层？

### 数据校验
- [ ] 是否使用 Pydantic 模型进行数据校验？
- [ ] 是否利用了自动类型转换功能？
- [ ] 嵌套数据结构是否定义了嵌套模型？

### 数据库
- [ ] SQLAlchemy 模型是否有表注释和字段注释？
- [ ] 是否禁止了 SQL 字符串拼接？
- [ ] 复杂查询是否使用查询构造器？

### 安全
- [ ] 密码是否使用 bcrypt/argon2 哈希？
- [ ] 敏感信息是否从环境变量读取？
- [ ] 生产环境 CORS 是否禁用了 `*` 通配符？

### 日志
- [ ] 是否配置了 logging 模块？
- [ ] 是否禁止了 `print()` 调试输出？


本规范应与之前的 Java 系列规范配套使用，作为 AI Agent 生成 Python Web 应用代码的完整约束。建议在实际项目中结合团队实际情况调整部分非强制性条目。