import MountDirectories from "./MountDirectories";

export default abstract class Job {
  public readonly mountDirectories: MountDirectories | null = null;
  public abstract convert(): any;
}
