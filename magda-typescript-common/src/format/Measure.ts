import {
    SelectedFormats
} from "./formats"
import { Record } from "../../dist/generated/registry/api";

export abstract class Measure {
    /**
     * set to False if Measure isn't able to determine filetype with the data given in constructor; dcat field is null for example
     */
    public canDeduceFormat: boolean = false;
    public abstract relatedDistribution: Record;

    constructor(relatedDistribution: Record){
        this.relatedDistribution = relatedDistribution;
    }
    /**
     * Returns a list of SelectedFormats deduced by the algorithm
     */
    abstract getSelectedFormats(): SelectedFormats;
}