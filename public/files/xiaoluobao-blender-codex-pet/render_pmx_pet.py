"""Render a PMX model into Codex V2 pet sprite frames with Blender.

The PMX file and the output directory are passed on the command line after
Blender's double dash. No model assets ship with this script; obtain the model
from its original distribution page and follow its terms.
"""

from __future__ import annotations

import argparse
import math
import sys
import traceback
from dataclasses import dataclass, field
from pathlib import Path

import bpy
from mathutils import Vector

CELL_WIDTH = 192
CELL_HEIGHT = 208
BASE_CAMERA_YAW = 12.0


@dataclass(frozen=True)
class Pose:
    """One procedural pose applied to the imported PMX rig."""

    rotations: dict[str, tuple[float, float, float]] = field(default_factory=dict)
    locations: dict[str, tuple[float, float, float]] = field(default_factory=dict)
    morphs: dict[str, float] = field(default_factory=dict)
    object_location: tuple[float, float, float] = (0.0, 0.0, 0.0)
    camera_yaw: float = BASE_CAMERA_YAW


@dataclass(frozen=True)
class Paths:
    """Filesystem locations supplied on the command line."""

    model: Path
    output_root: Path

    @property
    def frame_dir(self) -> Path:
        """Directory that receives the rendered frames."""
        return self.output_root / "frames"

    @property
    def log_path(self) -> Path:
        """Renderer log inside the output directory."""
        return self.output_root / "render.log"


def log(log_path: Path, message: str) -> None:
    """Append a status line to the renderer log.

    Args:
        log_path: Renderer log file.
        message: Status message.

    Returns:
        None.
    """
    print(message, flush=True)
    with log_path.open("a", encoding="utf-8") as handle:
        handle.write(f"{message}\n")


def parse_args() -> argparse.Namespace:
    """Parse arguments passed after Blender's double dash.

    Returns:
        Parsed renderer arguments.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--mode", choices=("calibration", "prototype", "full"), default="calibration"
    )
    parser.add_argument("--render-scale", type=int, choices=(1, 2), default=2)
    parser.add_argument("--model", type=Path, required=True, help="Path to the PMX model file.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        required=True,
        help="Directory that receives frames/ and render.log.",
    )
    script_args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(script_args)


def point_at(obj: bpy.types.Object, target: Vector) -> None:
    """Aim a camera or light at a world-space target.

    Args:
        obj: Object to orient.
        target: World-space target point.

    Returns:
        None.
    """
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def world_bounds(objects: list[bpy.types.Object]) -> tuple[Vector, Vector]:
    """Compute combined world-space bounds.

    Args:
        objects: Mesh objects included in the model.

    Returns:
        Minimum and maximum bounds.
    """
    corners = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    minimum = Vector(tuple(min(corner[index] for corner in corners) for index in range(3)))
    maximum = Vector(tuple(max(corner[index] for corner in corners) for index in range(3)))
    return minimum, maximum


def import_model(model_path: Path) -> tuple[bpy.types.Object, list[bpy.types.Object]]:
    """Import a PMX model with MMD Tools.

    Args:
        model_path: PMX file to import.

    Returns:
        Armature and imported meshes.
    """
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    if not (hasattr(bpy.ops, "mmd_tools") and hasattr(bpy.ops.mmd_tools, "import_model")):
        bpy.ops.preferences.addon_enable(module="bl_ext.blender_org.mmd_tools")
    bpy.ops.mmd_tools.import_model(
        filepath=str(model_path),
        types={"MESH", "ARMATURE", "MORPHS"},
        scale=0.08,
        clean_model=True,
        remove_doubles=False,
        fix_bone_order=True,
        rename_bones=False,
        use_mipmap=True,
        log_level="INFO",
    )
    armature = next(obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE")
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    return armature, meshes


def add_area_light(
    name: str,
    location: Vector,
    target: Vector,
    energy: float,
    size: float,
    color: tuple[float, float, float],
) -> bpy.types.Object:
    """Add a soft area light.

    Args:
        name: Light object name.
        location: World-space position.
        target: World-space target.
        energy: Light output in watts.
        size: Light diameter.
        color: RGB light color.

    Returns:
        Created light object.
    """
    data = bpy.data.lights.new(name=name, type="AREA")
    data.energy = energy
    data.color = color
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(name=name, object_data=data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    point_at(obj, target)
    return obj


def configure_scene(
    center: Vector,
    extent: Vector,
    render_scale: int,
) -> tuple[bpy.types.Object, dict[str, bpy.types.Object]]:
    """Configure a transparent sprite render and fixed camera.

    Args:
        center: Model bounds center.
        extent: Model bounds dimensions.
        render_scale: Integer supersampling scale.

    Returns:
        Configured orthographic camera and named light rig.
    """
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = CELL_WIDTH * render_scale
    scene.render.resolution_y = CELL_HEIGHT * render_scale
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = True
    scene.view_settings.look = "AgX - Medium High Contrast"

    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.035, 0.035, 0.035, 1.0)
    background.inputs["Strength"].default_value = 0.24

    camera_data = bpy.data.cameras.new("PetCamera")
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = extent.z * 1.25
    camera = bpy.data.objects.new("PetCamera", camera_data)
    bpy.context.scene.collection.objects.link(camera)
    scene.camera = camera
    camera.location = center + Vector((0.0, -max(extent) * 3.2, 0.0))
    point_at(camera, center)

    radius = max(extent)
    lights = {
        "key": add_area_light("KeyLight", center, center, 60.0, radius * 2.1, (1.0, 0.68, 0.48)),
        "fill": add_area_light("FillLight", center, center, 28.0, radius * 2.8, (0.68, 0.80, 1.0)),
        "rim": add_area_light("RimLight", center, center, 45.0, radius * 1.8, (1.0, 0.52, 0.28)),
    }
    return camera, lights


def reset_pose(armature: bpy.types.Object, meshes: list[bpy.types.Object]) -> None:
    """Reset pose bones and shape keys to their imported defaults.

    Args:
        armature: PMX armature object.
        meshes: Imported mesh objects.

    Returns:
        None.
    """
    armature.location = (0.0, 0.0, 0.0)
    for bone in armature.pose.bones:
        bone.rotation_mode = "XYZ"
        bone.location = (0.0, 0.0, 0.0)
        bone.rotation_euler = (0.0, 0.0, 0.0)
        bone.scale = (1.0, 1.0, 1.0)
    for mesh in meshes:
        if mesh.data.shape_keys is None:
            continue
        for key_block in mesh.data.shape_keys.key_blocks:
            if key_block.name != "Basis":
                key_block.value = 0.0


def apply_pose(armature: bpy.types.Object, meshes: list[bpy.types.Object], pose: Pose) -> None:
    """Apply one procedural pose.

    Args:
        armature: PMX armature object.
        meshes: Imported mesh objects.
        pose: Bone and morph values to apply.

    Returns:
        None.
    """
    reset_pose(armature, meshes)
    armature.location = pose.object_location
    for bone_name, rotation in pose.rotations.items():
        bone = armature.pose.bones.get(bone_name)
        if bone is not None:
            bone.rotation_euler = tuple(math.radians(value) for value in rotation)
    for bone_name, location in pose.locations.items():
        bone = armature.pose.bones.get(bone_name)
        if bone is not None:
            bone.location = location
    for mesh in meshes:
        if mesh.data.shape_keys is None:
            continue
        for morph_name, value in pose.morphs.items():
            key_block = mesh.data.shape_keys.key_blocks.get(morph_name)
            if key_block is not None:
                key_block.value = value
    bpy.context.view_layer.update()


def position_camera(
    camera: bpy.types.Object,
    lights: dict[str, bpy.types.Object],
    center: Vector,
    extent: Vector,
    yaw: float,
) -> None:
    """Orbit the sprite camera and light rig around the model.

    Args:
        camera: Sprite camera.
        lights: Named camera-relative light rig.
        center: Model bounds center.
        extent: Model bounds dimensions.
        yaw: Orbit angle in degrees, where zero is front.

    Returns:
        None.
    """
    angle = math.radians(yaw)
    direction = Vector((math.sin(angle), -math.cos(angle), 0.0))
    right = Vector((-direction.y, direction.x, 0.0)).normalized()
    up = Vector((0.0, 0.0, 1.0))
    radius = max(extent)
    camera.location = center + direction * radius * 3.2
    point_at(camera, center)
    lights["key"].location = (
        center + direction * radius * 1.8 - right * radius * 1.5 + up * radius * 1.7
    )
    lights["fill"].location = (
        center + direction * radius * 1.2 + right * radius * 1.7 + up * radius * 0.4
    )
    lights["rim"].location = (
        center - direction * radius * 1.4 + right * radius * 0.8 + up * radius * 1.5
    )
    for light in lights.values():
        point_at(light, center)


def render_pose(
    armature: bpy.types.Object,
    meshes: list[bpy.types.Object],
    camera: bpy.types.Object,
    lights: dict[str, bpy.types.Object],
    center: Vector,
    extent: Vector,
    name: str,
    pose: Pose,
    paths: Paths,
) -> None:
    """Render one named pose to a transparent PNG.

    Args:
        armature: PMX armature object.
        meshes: Imported mesh objects.
        camera: Sprite camera.
        lights: Named camera-relative light rig.
        center: Model bounds center.
        extent: Model bounds dimensions.
        name: Relative frame name without extension.
        pose: Pose to render.
        paths: Output locations.

    Returns:
        None.
    """
    apply_pose(armature, meshes, pose)
    position_camera(camera, lights, center, extent, pose.camera_yaw)
    output_path = paths.frame_dir / f"{name}.png"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.scene.render.filepath = str(output_path)
    bpy.ops.render.render(write_still=True)
    log(paths.log_path, f"Rendered {name}")


def calibration_poses() -> dict[str, Pose]:
    """Return axis-isolation poses for visual rig calibration.

    Returns:
        Named calibration poses.
    """
    return {
        "calibration/00-right-x60-yaw-12": Pose(
            rotations={"右腕": (60.0, 0.0, 0.0)}, camera_yaw=-12.0
        ),
        "calibration/01-right-x-60-yaw-12": Pose(
            rotations={"右腕": (-60.0, 0.0, 0.0)}, camera_yaw=-12.0
        ),
        "calibration/02-right-x90-yaw-12": Pose(
            rotations={"右肩": (20.0, 0.0, 0.0), "右腕": (90.0, 0.0, 0.0)},
            camera_yaw=-12.0,
        ),
        "calibration/03-right-x-90-yaw-12": Pose(
            rotations={"右肩": (-20.0, 0.0, 0.0), "右腕": (-90.0, 0.0, 0.0)},
            camera_yaw=-12.0,
        ),
        "calibration/04-left-x60-yaw12": Pose(
            rotations={"左腕": (60.0, 0.0, 0.0)}, camera_yaw=12.0
        ),
        "calibration/05-left-x-60-yaw12": Pose(
            rotations={"左腕": (-60.0, 0.0, 0.0)}, camera_yaw=12.0
        ),
        "calibration/06-left-x90-yaw12": Pose(
            rotations={"左肩": (20.0, 0.0, 0.0), "左腕": (90.0, 0.0, 0.0)},
            camera_yaw=12.0,
        ),
        "calibration/07-left-x-90-yaw12": Pose(
            rotations={"左肩": (-20.0, 0.0, 0.0), "左腕": (-90.0, 0.0, 0.0)},
            camera_yaw=12.0,
        ),
    }


def mirrored_arms(left: tuple[float, float, float]) -> dict[str, tuple[float, float, float]]:
    """Create visually mirrored left and right arm rotations.

    Args:
        left: Left-arm Euler rotation in degrees.

    Returns:
        Rotations for both upper arms.
    """
    x, y, z = left
    return {"左腕": (x, y, z), "右腕": (-x, y, -z)}


def idle_poses() -> list[Pose]:
    """Return a lively six-frame resting loop.

    Returns:
        Idle loop poses.
    """
    return [
        Pose(rotations={"頭": (0.0, -2.0, 0.0), "上半身2": (0.0, 0.0, 1.5)}),
        Pose(
            rotations={"頭": (-1.0, -3.0, -3.0), "上半身2": (0.0, 0.0, 0.0)},
            object_location=(0.0, 0.0, 0.003),
        ),
        Pose(
            rotations={"頭": (0.0, -4.0, -8.0), "上半身2": (0.0, 0.0, 2.5)},
            morphs={"まばたき": 1.0, "口角上げ": 0.25},
            object_location=(0.0, 0.0, 0.005),
        ),
        Pose(
            rotations={"頭": (-1.0, -2.0, 5.0), "上半身2": (0.0, 0.0, -1.5)},
            morphs={"笑い": 0.18},
            object_location=(0.0, 0.0, 0.003),
        ),
        Pose(rotations={"頭": (0.0, -1.0, 2.5)}, object_location=(0.0, 0.0, 0.001)),
        Pose(rotations={"頭": (0.0, -2.0, 0.0), "上半身2": (0.0, 0.0, 1.5)}),
    ]


def drag_poses(*, rightward: bool) -> list[Pose]:
    """Return an eight-frame side-facing drag-movement loop.

    Args:
        rightward: Whether the pet should face screen-right.

    Returns:
        Directional movement poses.
    """
    yaw = -78.0 if rightward else 78.0
    phases = [1.0, 0.7, 0.0, -0.7, -1.0, -0.7, 0.0, 0.7]
    left_lift = [0.0, 0.012, 0.028, 0.014, 0.0, 0.0, 0.0, 0.0]
    right_lift = [0.0, 0.0, 0.0, 0.0, 0.0, 0.012, 0.028, 0.014]
    body_lift = [0.006, 0.012, 0.018, 0.011, 0.006, 0.012, 0.018, 0.011]
    poses = []
    for index, phase in enumerate(phases):
        poses.append(
            Pose(
                rotations={
                    "左腕": (-phase * 30.0, 0.0, 0.0),
                    "右腕": (phase * 30.0, 0.0, 0.0),
                    "上半身": (-10.0, 0.0, 0.0),
                    "頭": (4.0, 0.0, -phase * 2.0),
                },
                locations={
                    "左足ＩＫ": (0.0, -phase * 0.052, left_lift[index]),
                    "右足ＩＫ": (0.0, phase * 0.052, right_lift[index]),
                },
                object_location=(0.0, 0.0, body_lift[index]),
                camera_yaw=yaw,
            )
        )
    return poses


def waving_poses() -> list[Pose]:
    """Return a four-frame friendly wave loop.

    Returns:
        Waving poses.
    """
    return [
        Pose(
            rotations={"右腕": (-25.0, 0.0, 0.0), "頭": (0.0, 2.0, -3.0)},
            camera_yaw=-12.0,
        ),
        Pose(
            rotations={
                "右肩": (-8.0, 0.0, 0.0),
                "右腕": (-58.0, 0.0, 6.0),
                "頭": (-2.0, 3.0, -7.0),
            },
            morphs={"口角上げ": 0.35},
            object_location=(0.0, 0.0, 0.004),
            camera_yaw=-12.0,
        ),
        Pose(
            rotations={
                "右肩": (-12.0, 0.0, 0.0),
                "右腕": (-70.0, 0.0, -8.0),
                "頭": (-4.0, 4.0, 6.0),
            },
            morphs={"笑い": 0.45},
            object_location=(0.0, 0.0, 0.007),
            camera_yaw=-12.0,
        ),
        Pose(
            rotations={
                "右肩": (-8.0, 0.0, 0.0),
                "右腕": (-58.0, 0.0, 6.0),
                "頭": (-2.0, 3.0, -7.0),
            },
            morphs={"口角上げ": 0.35},
            object_location=(0.0, 0.0, 0.004),
            camera_yaw=-12.0,
        ),
    ]


def jumping_poses() -> list[Pose]:
    """Return anticipation, airborne, and landing poses.

    Returns:
        Five-frame jump poses.
    """
    return [
        Pose(
            rotations={**mirrored_arms((8.0, 0.0, 3.0)), "頭": (8.0, 0.0, 0.0)},
            object_location=(0.0, 0.0, -0.010),
        ),
        Pose(
            rotations={**mirrored_arms((38.0, 0.0, 10.0)), "頭": (-5.0, 0.0, 0.0)},
            object_location=(0.0, 0.0, 0.025),
        ),
        Pose(
            rotations={**mirrored_arms((58.0, 0.0, 14.0)), "頭": (-8.0, 0.0, 0.0)},
            locations={"左足ＩＫ": (0.0, -0.012, 0.014), "右足ＩＫ": (0.0, 0.012, 0.014)},
            morphs={"笑い": 0.55, "口角上げ": 0.45},
            object_location=(0.0, 0.0, 0.055),
        ),
        Pose(
            rotations={**mirrored_arms((38.0, 0.0, 10.0)), "頭": (-4.0, 0.0, 0.0)},
            object_location=(0.0, 0.0, 0.025),
        ),
        Pose(
            rotations={**mirrored_arms((8.0, 0.0, 3.0)), "頭": (7.0, 0.0, 0.0)},
            object_location=(0.0, 0.0, -0.010),
        ),
    ]


def failed_poses() -> list[Pose]:
    """Return an eight-frame deflated reaction loop.

    Returns:
        Failed-state poses.
    """
    values = [0.0, 8.0, 16.0, 26.0, 34.0, 26.0, 14.0, 5.0]
    return [
        Pose(
            rotations={
                "頭": (value, 0.0, value * 0.08),
                "上半身": (value * 0.60, 0.0, 0.0),
                "左腕": (-value * 0.35, 0.0, 0.0),
                "右腕": (value * 0.35, 0.0, 0.0),
            },
            morphs={
                "困る": min(1.0, value / 14.0),
                "まばたき": max(0.0, (value - 10.0) / 16.0),
            },
            object_location=(0.0, 0.0, -value * 0.0009),
        )
        for value in values
    ]


def waiting_poses() -> list[Pose]:
    """Return a patient six-frame asking loop.

    Returns:
        Waiting-state poses.
    """
    tilts = [-7.0, -3.0, 3.0, 8.0, 4.0, -4.0]
    return [
        Pose(
            rotations={
                "左腕": (18.0 + (12.0 if index == 2 else 0.0), 0.0, 48.0 - index * 2.0),
                "右腕": (-18.0, 0.0, -48.0 + index * 2.0),
                "頭": (-5.0, -3.0 + index, tilt),
            },
            morphs={
                "びっくり": 0.40 if index in (2, 3) else 0.0,
                "まばたき": 1.0 if index == 4 else 0.0,
            },
            object_location=(0.0, 0.0, 0.004 if index in (2, 3) else 0.0),
        )
        for index, tilt in enumerate(tilts)
    ]


def working_poses() -> list[Pose]:
    """Return a focused six-frame non-locomotion work loop.

    Returns:
        Working-state poses.
    """
    phases = [-1.0, -0.4, 0.4, 1.0, 0.5, -0.5]
    return [
        Pose(
            rotations={
                "左腕": (22.0 + phase * 12.0, 0.0, 42.0 + phase * 12.0),
                "右腕": (-22.0 - phase * 12.0, 0.0, -42.0 + phase * 12.0),
                "頭": (5.0, phase * 7.0, phase * 4.0),
                "上半身2": (4.0, -phase * 3.0, -phase * 2.0),
            },
            morphs={
                "eyeNarrow_L": 0.30,
                "eyeNarrow_R": 0.30,
                "まばたき": 1.0 if phase == 1.0 else 0.0,
            },
            object_location=(0.0, 0.0, 0.004 * (1.0 - abs(phase))),
        )
        for phase in phases
    ]


def review_poses() -> list[Pose]:
    """Return a six-frame attentive review loop.

    Returns:
        Review-state poses.
    """
    yaws = [-14.0, -8.0, 0.0, 11.0, 16.0, 4.0]
    return [
        Pose(
            rotations={
                "頭": (-4.0 + index * 1.5, yaw, -yaw * 0.45),
                "上半身2": (3.0, yaw * 0.35, yaw * 0.15),
                "左腕": (8.0 + index * 2.0, 0.0, 18.0 + index * 5.0),
            },
            morphs={
                "eyeNarrow_L": 0.24,
                "eyeNarrow_R": 0.24,
                "まばたき": 1.0 if index == 3 else 0.0,
                "口角上げ": 0.20 if index in (4, 5) else 0.0,
            },
            object_location=(0.0, 0.0, 0.003 if index in (2, 3) else 0.0),
        )
        for index, yaw in enumerate(yaws)
    ]


def look_poses() -> list[Pose]:
    """Return sixteen clockwise cursor-look directions.

    Returns:
        Directional look poses beginning at 12 o'clock.
    """
    poses = []
    for index in range(16):
        angle = math.radians(index * 22.5)
        horizontal = math.sin(angle)
        vertical = math.cos(angle)
        morphs: dict[str, float] = {}
        if horizontal > 0.15:
            morphs["eyeLookRight"] = min(1.0, horizontal)
        elif horizontal < -0.15:
            morphs["eyeLookLeft"] = min(1.0, -horizontal)
        if vertical > 0.15:
            morphs["eyeLookUp"] = min(1.0, vertical)
        elif vertical < -0.15:
            morphs["eyeLookDown"] = min(1.0, -vertical)
        poses.append(
            Pose(
                rotations={
                    "頭": (-vertical * 17.0, -horizontal * 24.0, -horizontal * 5.0),
                    "上半身2": (-vertical * 3.0, -horizontal * 7.0, -horizontal * 2.0),
                },
                morphs=morphs,
            )
        )
    return poses


def full_rows() -> dict[int, list[Pose]]:
    """Return every populated row required by the Codex V2 pet contract.

    Returns:
        Mapping from atlas row to ordered poses.
    """
    looks = look_poses()
    return {
        0: idle_poses(),
        1: drag_poses(rightward=True),
        2: drag_poses(rightward=False),
        3: waving_poses(),
        4: jumping_poses(),
        5: failed_poses(),
        6: waiting_poses(),
        7: working_poses(),
        8: review_poses(),
        9: looks[:8],
        10: looks[8:],
    }


def full_poses() -> dict[str, Pose]:
    """Flatten all contract rows into named frame poses.

    Returns:
        Frame-relative names mapped to poses.
    """
    return {
        f"row{row:02d}/{column:02d}": pose
        for row, poses in full_rows().items()
        for column, pose in enumerate(poses)
    }


def run(args: argparse.Namespace, paths: Paths) -> None:
    """Run the selected PMX sprite rendering mode.

    Args:
        args: Parsed renderer arguments.
        paths: Model and output locations.

    Returns:
        None.
    """
    armature, meshes = import_model(paths.model)
    minimum, maximum = world_bounds(meshes)
    center = (minimum + maximum) * 0.5
    extent = maximum - minimum
    camera, lights = configure_scene(center, extent, args.render_scale)
    if args.mode == "calibration":
        poses = calibration_poses()
    elif args.mode == "prototype":
        poses = {
            **{f"prototype/idle-{index:02d}": pose for index, pose in enumerate(idle_poses())},
            **{
                f"prototype/run-right-{index:02d}": pose
                for index, pose in enumerate(drag_poses(rightward=True))
            },
            **{
                f"prototype/run-left-{index:02d}": pose
                for index, pose in enumerate(drag_poses(rightward=False))
            },
            **{f"prototype/wave-{index:02d}": pose for index, pose in enumerate(waving_poses())},
            **{f"prototype/jump-{index:02d}": pose for index, pose in enumerate(jumping_poses())},
            **{f"prototype/look-{index:02d}": pose for index, pose in enumerate(look_poses())},
        }
    elif args.mode == "full":
        poses = full_poses()
    else:
        raise ValueError(f"Unknown rendering mode: {args.mode}")
    for name, pose in poses.items():
        render_pose(armature, meshes, camera, lights, center, extent, name, pose, paths)
    log(paths.log_path, f"Completed mode: {args.mode}")


def main() -> None:
    """Parse arguments, render, and always quit Blender afterwards.

    Returns:
        None.
    """
    args = parse_args()
    paths = Paths(
        model=args.model.expanduser().resolve(),
        output_root=args.output_dir.expanduser().resolve(),
    )
    assert paths.model.is_file(), f"PMX model not found: {paths.model}"
    paths.output_root.mkdir(parents=True, exist_ok=True)
    paths.log_path.write_text("", encoding="utf-8")
    try:
        run(args, paths)
    except Exception:
        # Blender discards the traceback when it quits from a --python script;
        # keep a copy in the log for post-mortem inspection, then re-raise.
        with paths.log_path.open("a", encoding="utf-8") as handle:
            handle.write(traceback.format_exc())
        raise
    finally:
        bpy.ops.wm.quit_blender()


main()
